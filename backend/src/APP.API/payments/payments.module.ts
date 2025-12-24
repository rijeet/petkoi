import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { OfflinePaymentsController } from './offline-payments.controller';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { PaymentsService } from '../../APP.BLL/services/payments.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController, OfflinePaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}


