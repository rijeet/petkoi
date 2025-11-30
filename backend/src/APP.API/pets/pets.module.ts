import { Module } from '@nestjs/common';
import { PetsController } from './pets.controller';
import { PetService } from '../../APP.BLL/services/pet.service';
import { QRService } from '../../APP.BLL/services/qr.service';
import { NotificationService } from '../../APP.BLL/services/notification.service';
import { GPSService } from '../../APP.BLL/services/gps.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PetsController],
  providers: [PetService, QRService, NotificationService, GPSService],
  exports: [PetService],
})
export class PetsModule {}

