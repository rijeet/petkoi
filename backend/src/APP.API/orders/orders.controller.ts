import { Body, Controller, Get, Param, Post, UseGuards, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Type } from 'class-transformer';
import { Allow, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../APP.Infrastructure/auth/jwt.service';
import { OrdersService } from '../../APP.BLL/services/orders.service';
import { AdminGuard } from '../../common/guards/admin.guard';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  // Accept and ignore any provided orderNo to avoid whitelist errors
  @Allow()
  orderNo?: any;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingDistrict?: string;

  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  petId?: string;

  @IsOptional()
  @IsString()
  petQrUrl?: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async createOrder(@Body() body: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    this.logger.log(`createOrder request user=${user.sub} items=${body.items?.length ?? 0}`);
    try {
      // Explicitly drop orderNo if it arrives to avoid any lingering validation issues
      const { orderNo: _ignored, ...rest } = body;
      const result = await this.ordersService.createOrder({
        userId: user.sub,
        items: rest.items,
        shippingAddress: rest.shippingAddress,
        shippingDistrict: rest.shippingDistrict,
        shippingPostalCode: rest.shippingPostalCode,
        contactPhone: rest.contactPhone,
        contactName: rest.contactName,
        petId: (rest as any).petId,
        petQrUrl: (rest as any).petQrUrl,
        idempotencyKey: (rest as any).idempotencyKey,
      });
      return {
        orderNo: result.order.orderNo,
        status: result.order.status,
        totalBDT: result.order.totalBDT,
        shippingFeeBDT: result.order.shippingFeeBDT,
        order: result.order,
        shipping: result.shipping,
      };
    } catch (err) {
      this.logger.error(`createOrder failed: ${err instanceof Error ? err.message : String(err)}`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  @Get()
  async listOrders(@CurrentUser() user: JwtPayload) {
    this.logger.log(`listOrders user=${user.sub}`);
    const orders = await this.ordersService.listOrdersForUser(user.sub);
    this.logger.log(`listOrders found ${orders.length} orders`);
    return orders;
  }

  @Get(':orderNo')
  async getOrder(@Param('orderNo') orderNo: string, @CurrentUser() user: JwtPayload) {
    this.logger.log(`getOrder request user=${user.sub} orderNo=${orderNo}`);
    const order = await this.ordersService.getOrderByNo(orderNo, user.sub);
    this.logger.log(`getOrder found id=${order.id} status=${order.status}`);
    return order;
  }

  @Post(':orderNo/tracking')
  @UseGuards(AdminGuard)
  async setTracking(
    @Param('orderNo') orderNo: string,
    @Body('status') status: string,
    @Body('description') description?: string,
  ) {
    this.logger.log(`setTracking orderNo=${orderNo} status=${status}`);
    return this.ordersService.setTrackingStatus(orderNo, status, description);
  }
}

