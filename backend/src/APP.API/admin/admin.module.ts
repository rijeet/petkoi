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
import { AdminSupportController } from './admin-support.controller';
import { AdminDonationsController } from './admin-donations.controller';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { SupportModule } from '../support/support.module';
import { DonationsModule } from '../donations/donations.module';

@Module({
  imports: [ConfigModule, PrismaModule, OrdersModule, SupportModule, DonationsModule, JwtModule.register({})],
  controllers: [
    AdminOrdersController,
    AdminUsersController,
    AdminLostPetsController,
    AdminStatsController,
    AdminSchemaController,
    AdminSupportController,
    AdminDonationsController,
  ],
  providers: [AdminAccessGuard],
})
export class AdminModule {}

