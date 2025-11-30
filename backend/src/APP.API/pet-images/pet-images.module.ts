import { Module } from '@nestjs/common';
import { PetImagesController } from './pet-images.controller';
import { PetImageService } from '../../APP.BLL/services/pet-image.service';
import { ImageKitModule } from '../../APP.Infrastructure/imagekit/imagekit.module';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ImageKitModule],
  controllers: [PetImagesController],
  providers: [PetImageService],
  exports: [PetImageService],
})
export class PetImagesModule {}

