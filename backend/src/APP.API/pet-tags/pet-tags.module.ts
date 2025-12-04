import { Module } from '@nestjs/common';
import { PetTagsController } from './pet-tags.controller';
import { PetTagOrderService } from '../../APP.BLL/services/pet-tag-order.service';
import { PetTagPreviewService } from '../../APP.BLL/services/pet-tag-preview.service';
import { PetService } from '../../APP.BLL/services/pet.service';
import { QRService } from '../../APP.BLL/services/qr.service';
import { NotificationService } from '../../APP.BLL/services/notification.service';
import { GPSService } from '../../APP.BLL/services/gps.service';
import { ImageKitModule } from '../../APP.Infrastructure/imagekit/imagekit.module';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ImageKitModule],
  controllers: [PetTagsController],
  providers: [
    PetTagOrderService,
    PetTagPreviewService,
    PetService,
    QRService,
    NotificationService,
    GPSService,
  ],
  exports: [PetTagOrderService],
})
export class PetTagsModule {}

