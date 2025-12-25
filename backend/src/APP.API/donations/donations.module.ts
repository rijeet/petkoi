import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationService } from '../../APP.BLL/services/donation.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DonationsController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationsModule {}

