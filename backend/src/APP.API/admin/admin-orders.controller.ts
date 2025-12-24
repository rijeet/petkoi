import { Controller, Get, Param, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { OrdersService } from '../../APP.BLL/services/orders.service';
import { validateStatusTransition, type OrderStatus } from '../../common/utils/order-status-transitions';

@Controller('admin/orders')
@UseGuards(AdminAccessGuard)
export class AdminOrdersController {
  constructor(private readonly prisma: PrismaService, private readonly ordersService: OrdersService) {}

  @Get()
  async list(
    @Query('orderNo') orderNo?: string,
    @Query('status') status?: string,
    @Query('userEmail') userEmail?: string,
    @Query('take') take?: string,
  ) {
    const where: any = {};
    if (orderNo) where.orderNo = orderNo;
    if (status) where.status = status;
    if (userEmail) {
      where.user = { email: userEmail };
    }
    const takeNum = take ? Math.min(Number(take) || 20, 100) : 20;
    const orders = await this.prisma.order.findMany({
      where,
      take: takeNum,
      orderBy: { createdAt: 'desc' },
      select: {
        orderNo: true,
        status: true,
        totalBDT: true,
        subtotalBDT: true,
        shippingFeeBDT: true,
        petId: true,
        petQrUrl: true,
        contactName: true,
        contactPhone: true,
        shippingAddress: true,
        shippingDistrict: true,
        shippingPostalCode: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        items: {
          select: {
            productId: true,
            name: true,
            sku: true,
            quantity: true,
            unitPriceBDT: true,
            totalBDT: true,
          },
        },
        manualPayments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            method: true,
            amountBDT: true,
            trxId: true,
            agentAccount: true,
            contactNumber: true,
            note: true,
            status: true,
            createdAt: true,
          },
        },
        pet: { select: { id: true, name: true, qrCodeUrl: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return orders;
  }

  @Get(':orderNo')
  async detail(@Param('orderNo') orderNo: string) {
    return this.prisma.order.findFirst({
      where: { orderNo },
      include: {
        items: true,
        manualPayments: { orderBy: { createdAt: 'desc' } },
        pet: { select: { id: true, name: true, qrCodeUrl: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  @Post(':orderNo/tracking')
  async setTracking(
    @Param('orderNo') orderNo: string,
    @Body() body: { status: string; description?: string },
  ) {
    return this.ordersService.setTrackingStatus(orderNo, body.status, body.description);
  }

  @Post(':orderNo/status')
  async updateStatus(
    @Param('orderNo') orderNo: string,
    @Body() body: { status: string },
  ) {
    const order = await this.prisma.order.findFirst({ where: { orderNo } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Validate status transition
    try {
      validateStatusTransition(order.status as OrderStatus, body.status as OrderStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid status transition';
      throw new BadRequestException(message);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: body.status as any },
    });
    return { orderNo, status: updated.status };
  }
}

