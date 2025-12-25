import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportTicketService } from '../../APP.BLL/services/support-ticket.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SupportController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportModule {}

