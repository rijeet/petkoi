import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SupportTicketService } from '../../APP.BLL/services/support-ticket.service';
import {
  CreateSupportTicketDto,
  AddMessageDto,
  UpdateTicketStatusDto,
  MessageSenderType,
} from '../../APP.Shared/dtos/support.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('support')
@ApiBearerAuth('JWT-auth')
@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiBody({ type: CreateSupportTicketDto })
  @ApiResponse({ status: 201, description: 'Support ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @Body() createTicketDto: CreateSupportTicketDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.supportTicketService.createTicket(
      user.sub,
      createTicketDto.subject,
      createTicketDto.message,
      createTicketDto.priority,
    );
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets for the current user' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getMyTickets(@CurrentUser() user: { sub: string }) {
    return this.supportTicketService.getUserTickets(user.sub);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get a specific support ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 403, description: 'You do not have access to this ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.supportTicketService.getTicketById(id, user.sub);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message to a support ticket' })
  @ApiBody({ type: AddMessageDto })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 400, description: 'Cannot add message to closed ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Param('id') ticketId: string,
    @Body() addMessageDto: AddMessageDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.supportTicketService.addMessage(ticketId, user.sub, addMessageDto.content, MessageSenderType.USER);
  }

  @Patch('tickets/:id/read')
  @ApiOperation({ summary: 'Mark messages as read in a ticket' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') ticketId: string, @CurrentUser() user: { sub: string }) {
    return this.supportTicketService.markMessagesAsRead(ticketId, user.sub, false);
  }
}

