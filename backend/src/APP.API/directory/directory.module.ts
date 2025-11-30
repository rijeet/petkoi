import { Module } from '@nestjs/common';
import { DirectoryController } from './directory.controller';
import { DirectoryService } from '../../APP.BLL/services/directory.service';
import { GPSService } from '../../APP.BLL/services/gps.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DirectoryController],
  providers: [DirectoryService, GPSService],
  exports: [DirectoryService],
})
export class DirectoryModule {}

