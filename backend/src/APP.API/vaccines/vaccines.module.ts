import { Module } from '@nestjs/common';
import { VaccinesController } from './vaccines.controller';
import { VaccineService } from '../../APP.BLL/services/vaccine.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { ImageKitModule } from '../../APP.Infrastructure/imagekit/imagekit.module';

@Module({
  imports: [PrismaModule, ImageKitModule],
  controllers: [VaccinesController],
  providers: [VaccineService],
  exports: [VaccineService],
})
export class VaccinesModule {}

