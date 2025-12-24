import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { DomainException } from '@APP.Shared/exceptions/domain.exception';
import { ManualPaymentMethod } from '@prisma/client';
import { canAcceptPayment, validateStatusTransition, type OrderStatus } from '../../common/utils/order-status-transitions';

const SSL_SANDBOX_BASE = 'https://sandbox.sslcommerz.com';
const SSL_PROD_BASE = 'https://securepay.sslcommerz.com';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getBaseUrl() {
    const sandbox = this.config.get<string>('SSLCOMMERZ_SANDBOX') === 'true';
    return sandbox ? SSL_SANDBOX_BASE : SSL_PROD_BASE;
  }

  private getCredentials() {
    const storeId = this.config.get<string>('SSLCOMMERZ_STORE_ID');
    const storePasswd = this.config.get<string>('SSLCOMMERZ_STORE_PASSWD');
    if (!storeId || !storePasswd) {
      throw new DomainException('Payment credentials not configured', 500);
    }
    return { storeId, storePasswd };
  }

  private async callSslCommerz(path: string, payload: Record<string, any>) {
    const url = `${this.getBaseUrl()}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload as any).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new DomainException(`SSLCommerz error: ${text}`, 502);
    }
    return res.json() as Promise<any>;
  }

  private async validateValId(valId: string) {
    const { storeId, storePasswd } = this.getCredentials();
    const url = `${this.getBaseUrl()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
      valId,
    )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePasswd)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new DomainException(`Validation fetch failed: ${text}`, 502);
    }
    return res.json() as Promise<any>;
  }

  async createSslSession(userId: string, orderNo: string, options: { successUrl: string; failUrl: string; cancelUrl: string }) {
    const order = await this.prisma.order.findFirst({
      where: { orderNo, userId },
      include: { items: true, user: true },
    });
    if (!order) throw new DomainException('Order not found', 404);
    
    // Validate that order can accept payment
    if (!canAcceptPayment(order.status as OrderStatus)) {
      throw new DomainException(`Order not payable. Current status: ${order.status}`, 400);
    }
    
    // Check expiry
    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new DomainException('Order expired', 409);
    }

    const { storeId, storePasswd } = this.getCredentials();
    const tranId = order.orderNo;
    const amount = order.totalBDT;

    const payload: Record<string, any> = {
      store_id: storeId,
      store_passwd: storePasswd,
      total_amount: amount,
      currency: 'BDT',
      tran_id: tranId,
      success_url: options.successUrl,
      fail_url: options.failUrl,
      cancel_url: options.cancelUrl,
      emi_option: 0,
      cus_name: order.contactName || order.user.name || 'Customer',
      cus_email: order.user.email || 'no-email@example.com',
      cus_add1: order.shippingAddress || 'N/A',
      cus_city: order.shippingDistrict || 'N/A',
      cus_postcode: order.shippingPostalCode || '0000',
      cus_country: 'Bangladesh',
      cus_phone: order.contactPhone || order.user.phone || '00000000000',
      shipping_method: 'HOME_DELIVERY',
      product_profile: 'general',
      product_name: order.items.map((i) => i.name).join(', ').slice(0, 255) || 'Items',
    };

    this.logger.log(`createSslSession start orderNo=${orderNo} user=${userId} amount=${amount}`);
    const response = await this.callSslCommerz('/gwprocess/v3/api.php', payload);
    if (!response?.status || response.status.toLowerCase() !== 'success') {
      throw new DomainException('Failed to initiate payment session');
    }

    await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        provider: 'SSLCOMMERZ',
        status: 'REDIRECTED',
        amountBDT: amount,
        currency: 'BDT',
        sessionKey: response.sessionkey || null,
        tranId,
        redirectUrl: response.GatewayPageURL,
        rawResponse: response,
      },
    });

    this.logger.log(`createSslSession success orderNo=${orderNo} tranId=${tranId}`);
    return {
      redirectUrl: response.GatewayPageURL,
      tranId,
      sessionKey: response.sessionkey,
    };
  }

  async handleSuccess(params: { orderNo?: string; val_id?: string; tran_id?: string }) {
    if (!params.val_id) throw new DomainException('Missing val_id');
    const validation = await this.validateValId(params.val_id);
    const tranId = validation.tran_id || params.tran_id;
    const order = await this.prisma.order.findFirst({ where: { orderNo: tranId } });
    if (!order) throw new DomainException('Order not found', 404);
    if (order.status === 'PAYMENT_VERIFIED') return order;

    // amount/currency check
    const amount = Math.round(Number(validation.amount || validation.amount_bdt || 0));
    if (amount !== order.totalBDT || validation.currency !== 'BDT') {
      throw new DomainException('Payment amount mismatch', 400);
    }
    if (!['VALID', 'VALIDATED'].includes((validation.status || '').toUpperCase())) {
      throw new DomainException('Payment not validated', 400);
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_VERIFIED' },
      }),
      this.prisma.paymentIntent.upsert({
        where: { tranId_provider: { tranId, provider: 'SSLCOMMERZ' } },
        create: {
          orderId: order.id,
          provider: 'SSLCOMMERZ',
          status: 'SUCCESS',
          amountBDT: order.totalBDT,
          currency: 'BDT',
          tranId,
          valId: params.val_id,
          rawResponse: validation,
        },
        update: {
          status: 'SUCCESS',
          valId: params.val_id,
          rawResponse: validation,
        },
      }),
    ]);

    this.logger.log(`handleSuccess paid orderNo=${order.orderNo} tranId=${tranId}`);
    return { orderNo: order.orderNo, status: 'PAYMENT_VERIFIED' };
  }

  async handleFail(params: { tran_id?: string }) {
    if (!params.tran_id) throw new DomainException('Missing tran_id');
    const order = await this.prisma.order.findFirst({ where: { orderNo: params.tran_id } });
    if (!order) throw new DomainException('Order not found', 404);
    await this.prisma.$transaction([
      this.prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } }),
      this.prisma.paymentIntent.updateMany({
        where: { orderId: order.id, provider: 'SSLCOMMERZ' },
        data: { status: 'FAILED' },
      }),
    ]);
    this.logger.warn(`handleFail orderNo=${order.orderNo} tranId=${params.tran_id}`);
    return { orderNo: order.orderNo, status: 'FAILED' };
  }

  async createManualPayment(
    userId: string,
    dto: { orderNo: string; method: ManualPaymentMethod; amountBDT: number; trxId: string; agentAccount?: string; contactNumber?: string; note?: string },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { orderNo: dto.orderNo, userId },
    });
    if (!order) throw new DomainException('Order not found', 404);
    
    // Validate that order can accept payment
    if (!canAcceptPayment(order.status as OrderStatus)) {
      throw new DomainException(`Order not payable. Current status: ${order.status}`, 400);
    }
    
    // Check expiry
    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new DomainException('Order expired', 409);
    }

    // Validate transition to PAYMENT_UNDER_REVIEW
    validateStatusTransition(order.status as OrderStatus, 'PAYMENT_UNDER_REVIEW');

    const [payment] = await this.prisma.$transaction([
      this.prisma.manualPayment.create({
        data: {
          orderId: order.id,
          userId,
          method: dto.method,
          amountBDT: dto.amountBDT,
          currency: 'BDT',
          trxId: dto.trxId,
          agentAccount: dto.agentAccount,
          contactNumber: dto.contactNumber,
          note: dto.note,
          status: 'PENDING',
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_UNDER_REVIEW' },
      }),
    ]);

    // keep order pending; a backoffice/admin can later approve
    return { orderNo: order.orderNo, manualPaymentId: payment.id, status: 'PENDING' };
  }
}

