import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from '../../APP.BLL/services/notification.service';
import { GPSService } from '../../APP.BLL/services/gps.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationService, GPSService],
  exports: [NotificationService],
})
export class NotificationsModule {}

