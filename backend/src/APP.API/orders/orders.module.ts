import { Module } from '@nestjs/common';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { ShippingCalculatorService } from '../../APP.BLL/services/shipping-calculator.service';
import { OrdersService } from '../../APP.BLL/services/orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [ShippingCalculatorService, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}


