import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TagColor {
  GREEN = 'GREEN',
  PINK = 'PINK',
  BLUE = 'BLUE',
  BLACK = 'BLACK',
}

export enum PetTagOrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class CreatePetTagOrderDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Pet ID (UUID)' })
  @IsUUID()
  petId!: string;

  @ApiProperty({ example: 'PINK', enum: TagColor, description: 'Tag color' })
  @IsEnum(TagColor)
  tagColor!: TagColor;

  @ApiPropertyOptional({ example: 'MEDIUM', description: 'Tag size (optional)' })
  @IsOptional()
  @IsString()
  tagSize?: string;
}

export class UpdatePetTagOrderStatusDto {
  @ApiProperty({ example: 'PROCESSING', enum: PetTagOrderStatus, description: 'Order status' })
  @IsEnum(PetTagOrderStatus)
  status!: PetTagOrderStatus;
}

