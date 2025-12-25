import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MessageSenderType {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class CreateSupportTicketDto {
  @ApiProperty({ example: 'Order payment issue', description: 'Ticket subject' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'I submitted payment but order status is still pending', description: 'Initial message content' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: 'MEDIUM', enum: SupportTicketPriority, description: 'Ticket priority', default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}

export class AddMessageDto {
  @ApiProperty({ example: 'Thank you for the update. I have verified the payment.', description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ example: 'IN_PROGRESS', enum: SupportTicketStatus, description: 'New ticket status' })
  @IsEnum(SupportTicketStatus)
  status!: SupportTicketStatus;
}

export class AssignTicketDto {
  @ApiProperty({ example: 'admin-id-123', description: 'Admin user ID to assign ticket to' })
  @IsString()
  @IsNotEmpty()
  adminId!: string;
}

export class UpdateTicketPriorityDto {
  @ApiProperty({ example: 'HIGH', enum: SupportTicketPriority, description: 'New ticket priority' })
  @IsEnum(SupportTicketPriority)
  priority!: SupportTicketPriority;
}

