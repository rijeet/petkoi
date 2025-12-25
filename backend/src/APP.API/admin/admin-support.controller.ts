import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SupportTicketService } from '../../APP.BLL/services/support-ticket.service';
import {
  AddMessageDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
  UpdateTicketPriorityDto,
  SupportTicketStatus,
  MessageSenderType,
} from '../../APP.Shared/dtos/support.dto';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/support')
@UseGuards(AdminAccessGuard)
export class AdminSupportController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets (admin)' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getAllTickets(
    @Query('status') status?: SupportTicketStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.supportTicketService.getAllTickets(status, assignedTo);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get a specific support ticket by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(@Param('id') id: string) {
    return this.supportTicketService.getTicketById(id, undefined, true);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message to a support ticket (admin)' })
  @ApiBody({ type: AddMessageDto })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Param('id') ticketId: string,
    @Body() addMessageDto: AddMessageDto,
    @CurrentAdmin() admin: { sub: string },
  ) {
    return this.supportTicketService.addMessage(ticketId, admin.sub, addMessageDto.content, MessageSenderType.ADMIN);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status (admin)' })
  @ApiBody({ type: UpdateTicketStatusDto })
  @ApiResponse({ status: 200, description: 'Ticket status updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') ticketId: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
  ) {
    return this.supportTicketService.updateTicketStatus(ticketId, updateStatusDto.status);
  }

  @Patch('tickets/:id/assign')
  @ApiOperation({ summary: 'Assign ticket to an admin' })
  @ApiBody({ type: AssignTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 404, description: 'Ticket or admin not found' })
  @HttpCode(HttpStatus.OK)
  async assignTicket(
    @Param('id') ticketId: string,
    @Body() assignDto: AssignTicketDto,
  ) {
    return this.supportTicketService.assignTicket(ticketId, assignDto.adminId);
  }

  @Patch('tickets/:id/priority')
  @ApiOperation({ summary: 'Update ticket priority (admin)' })
  @ApiBody({ type: UpdateTicketPriorityDto })
  @ApiResponse({ status: 200, description: 'Ticket priority updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @HttpCode(HttpStatus.OK)
  async updatePriority(
    @Param('id') ticketId: string,
    @Body() updatePriorityDto: UpdateTicketPriorityDto,
  ) {
    return this.supportTicketService.updateTicketPriority(ticketId, updatePriorityDto.priority);
  }

  @Patch('tickets/:id/read')
  @ApiOperation({ summary: 'Mark messages as read in a ticket (admin)' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') ticketId: string, @CurrentAdmin() admin: { sub: string }) {
    return this.supportTicketService.markMessagesAsRead(ticketId, admin.sub, true);
  }
}

