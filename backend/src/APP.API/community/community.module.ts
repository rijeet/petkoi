import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from '../../APP.BLL/services/community.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}

