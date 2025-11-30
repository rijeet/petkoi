import { Module } from '@nestjs/common';
import { GPSController } from './gps.controller';
import { GPSService } from '../../APP.BLL/services/gps.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GPSController],
  providers: [GPSService],
  exports: [GPSService],
})
export class GPSModule {}

