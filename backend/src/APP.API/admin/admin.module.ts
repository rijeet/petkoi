import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminLostPetsController } from './admin-lost-pets.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminSchemaController } from './admin-schema.controller';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';

@Module({
  imports: [ConfigModule, PrismaModule, OrdersModule, JwtModule.register({})],
  controllers: [
    AdminOrdersController,
    AdminUsersController,
    AdminLostPetsController,
    AdminStatsController,
    AdminSchemaController,
  ],
  providers: [AdminAccessGuard],
})
export class AdminModule {}

