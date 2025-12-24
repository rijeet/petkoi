import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { DomainException } from '@APP.Shared/exceptions/domain.exception';
import { validateStatusTransition, canExpire, type OrderStatus } from '../../common/utils/order-status-transitions';

type OrderItemInput = { productId: string; quantity: number };

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private expiryInterval?: NodeJS.Timeout;
  private readonly EXPIRY_MS: number;
  private readonly CLEANUP_MS: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingCalculator: ShippingCalculatorService,
  ) {
    const expiryMinutes = Number(process.env.ORDER_EXPIRY_MINUTES || 5);
    const cleanupHours = Number(process.env.ORDER_EXPIRED_CLEANUP_HOURS || 24);
    this.EXPIRY_MS = expiryMinutes * 60 * 1000;
    this.CLEANUP_MS = cleanupHours * 60 * 60 * 1000;
  }

  onModuleInit() {
    this.expiryInterval = setInterval(() => {
      this.expirePendingOrders().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('expirePendingOrders failed', err);
      });
      this.deleteExpiredOrders().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('deleteExpiredOrders failed', err);
      });
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
    }
  }

  private generateOrderNo() {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private extractPostalCode(address?: string, provided?: string) {
    if (provided) return provided;
    if (!address) return undefined;
    const match = address.match(/(\d{4})/);
    return match ? match[1] : undefined;
  }

  private normalizeDistrict(d?: string) {
    return d?.trim() || undefined;
  }

  async createOrder(params: {
    userId: string;
    items: OrderItemInput[];
    shippingAddress?: string;
    shippingDistrict?: string;
    shippingPostalCode?: string;
    contactPhone?: string;
    contactName?: string;
    idempotencyKey?: string;
    petId?: string;
    petQrUrl?: string;
  }) {
    const {
      userId,
      items,
      shippingAddress,
      shippingDistrict,
      shippingPostalCode,
      contactPhone,
      contactName,
      petId,
      petQrUrl,
    } = params;
    if (!items?.length) {
      throw new DomainException('No items provided');
    }

    const normalizedDistrict = this.normalizeDistrict(shippingDistrict);
    const extractedPostal = this.extractPostalCode(shippingAddress, shippingPostalCode);

    // Basic idempotency / double-click dedupe: reuse a recent pending order with identical items and shipping fields
    const recentPending = await this.prisma.order.findMany({
      where: {
        userId,
        status: 'PENDING',
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      include: { items: true, shippingZone: true },
    });

    // Accept product input as id or SKU
    // eslint-disable-next-line no-console
    console.log('createOrder payload', { userId, items });
    const productKeys = Array.from(new Set(items.map((i) => i.productId)));
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { id: { in: productKeys } },
          { sku: { in: productKeys } },
        ],
      },
      include: { shippingProfile: { include: { shippingCategory: true } } },
    });
    if (products.length === 0) {
      // eslint-disable-next-line no-console
      console.error('No matching products found for keys', productKeys);
      throw new DomainException('One or more products are unavailable');
    }

    const detailedItems = items.map((item) => {
      const product =
        products.find((p) => p.id === item.productId) ||
        products.find((p) => p.sku === item.productId);
      if (!product) {
        // eslint-disable-next-line no-console
        console.error('Product not found for item', item.productId);
        throw new DomainException('One or more products are unavailable');
      }
      const profile = product.shippingProfile;
      const qty = item.quantity || 1;
      const weightGrams = (profile?.weightGrams ?? product.weightGrams) * qty;
      const volumetricWeightGrams = profile?.volumetricWeightGrams ? profile.volumetricWeightGrams * qty : undefined;
      const longestSideCm = profile?.longestSideCm ?? product.longestSideCm;
      const catExtra = profile?.shippingCategory?.extraFlatBDT ?? 0;
      return {
        product,
        qty,
        unitPriceBDT: product.priceBDT,
        weightGrams,
        volumetricWeightGrams,
        longestSideCm,
        categoryExtraBDT: catExtra,
      };
    });

    const subtotalBDT = detailedItems.reduce((acc, it) => acc + it.unitPriceBDT * it.qty, 0);
    const shipping = await this.shippingCalculator.calculate({
      items: detailedItems.map((it) => ({
        weightGrams: it.weightGrams / (it.qty || 1),
        volumetricWeightGrams: it.volumetricWeightGrams ? it.volumetricWeightGrams / (it.qty || 1) : undefined,
        quantity: it.qty,
        categoryExtraBDT: it.categoryExtraBDT,
        longestSideCm: it.longestSideCm,
      })),
      subtotalBDT,
      postalCode: extractedPostal,
      district: normalizedDistrict,
    });

    const sortedIncoming = items
      .map((i) => ({ productId: i.productId, quantity: i.quantity }))
      .sort((a, b) => (a.productId > b.productId ? 1 : -1));

    const matchExisting = recentPending.find((o) => {
      if (o.shippingPostalCode !== extractedPostal) return false;
      if ((o.shippingDistrict || '') !== (normalizedDistrict || '')) return false;
      if ((o.shippingAddress || '') !== (shippingAddress ?? '')) return false;
      const sortedExisting = o.items
        .map((i) => ({ productId: i.productId || i.sku || '', quantity: i.quantity }))
        .sort((a, b) => (a.productId > b.productId ? 1 : -1));
      return (
        sortedExisting.length === sortedIncoming.length &&
        sortedExisting.every((it, idx) => it.productId === sortedIncoming[idx].productId && it.quantity === sortedIncoming[idx].quantity)
      );
    });

    if (matchExisting) {
      // eslint-disable-next-line no-console
      console.log('Reusing pending order for user', { userId, orderNo: matchExisting.orderNo });
      return {
        order: matchExisting,
        shipping: {
          totalShippingBDT: matchExisting.shippingFeeBDT,
          weightGrams: matchExisting.weightGrams,
          zone: matchExisting.shippingZone ?? { id: matchExisting.shippingZoneId, isHomeDelivery: matchExisting.isHomeDelivery },
        },
      };
    }

    const orderNo = this.generateOrderNo();
    const expiresAt = new Date(Date.now() + this.EXPIRY_MS);
    const order = await this.prisma.order.create({
      data: {
        orderNo,
        userId,
        petId,
        status: 'PENDING',
        expiresAt,
        currency: 'BDT',
        subtotalBDT,
        shippingFeeBDT: shipping.totalShippingBDT,
        totalBDT: subtotalBDT + shipping.totalShippingBDT,
        weightGrams: shipping.weightGrams,
        shippingZoneId: shipping.zone.id,
        shippingAddress: shippingAddress ?? '',
        shippingDistrict: normalizedDistrict,
        shippingPostalCode: extractedPostal,
        isHomeDelivery: shipping.zone.isHomeDelivery,
        contactPhone,
        contactName,
        petQrUrl,
        items: {
          create: detailedItems.map((it) => ({
            productId: it.product.id,
            name: it.product.name,
            sku: it.product.sku,
            unitPriceBDT: it.unitPriceBDT,
            quantity: it.qty,
            weightGrams: it.weightGrams,
            categoryExtraBDT: it.categoryExtraBDT,
            totalBDT: it.unitPriceBDT * it.qty,
          })),
        },
      },
      include: { items: true, shippingZone: true },
    });

    // eslint-disable-next-line no-console
    console.log('Order created', { userId, orderNo });

    return {
      order,
      shipping,
    };
  }

  private async expirePendingOrders() {
    const now = new Date();
    // Only expire orders that are in PENDING status (canExpire check)
    const result = await this.prisma.order.updateMany({
      where: {
        status: 'PENDING', // Only PENDING orders can be expired
        expiresAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    if (result.count > 0) {
      // eslint-disable-next-line no-console
      console.log(`Expired ${result.count} pending orders older than ${this.EXPIRY_MS / 60000} minutes`);
    }
  }

  private async deleteExpiredOrders() {
    const cutoff = new Date(Date.now() - this.CLEANUP_MS);
    const result = await this.prisma.order.deleteMany({
      where: {
        status: 'EXPIRED',
        updatedAt: { lt: cutoff },
      },
    });
    if (result.count > 0) {
      // eslint-disable-next-line no-console
      console.log(`Deleted ${result.count} expired orders older than ${this.CLEANUP_MS / (60 * 60 * 1000)} hours`);
    }
  }

  async getOrderByNo(orderNo: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        OR: [{ orderNo }, { id: orderNo }],
      },
      include: {
        items: true,
        shippingZone: true,
        pet: {
          select: {
            id: true,
            name: true,
            qrCodeUrl: true,
          },
        },
      },
      // Explicitly include petQrUrl and petId fields
    });
    if (!order) {
      throw new DomainException('Order not found', 404);
    }
    // petQrUrl and petId are automatically included with include, but let's ensure they're returned
    return order;
  }

  async listOrdersForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        orderNo: true,
        status: true,
        subtotalBDT: true,
        shippingFeeBDT: true,
        totalBDT: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async setTrackingStatus(orderNo: string, status: string, description?: string) {
    // Deprecated: Use admin status update endpoint instead. This method now just updates status.
    const order = await this.prisma.order.findFirst({ where: { orderNo } });
    if (!order) {
      throw new DomainException('Order not found', 404);
    }

    // Validate status transition
    try {
      validateStatusTransition(order.status as OrderStatus, status as OrderStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid status transition';
      throw new DomainException(message, 400);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: status as any },
    });
    return { orderNo, status: updated.status };
  }
}

