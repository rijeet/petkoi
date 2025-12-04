import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

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
  @IsUUID()
  petId!: string;

  @IsEnum(TagColor)
  tagColor!: TagColor;

  @IsOptional()
  @IsString()
  tagSize?: string;
}

export class UpdatePetTagOrderStatusDto {
  @IsEnum(PetTagOrderStatus)
  status!: PetTagOrderStatus;
}

