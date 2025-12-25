import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVaccineDto {
  @ApiProperty({ example: 'Rabies', description: 'Vaccine name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Dose number (e.g., 1st dose, 2nd dose)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumber?: number;

  @ApiPropertyOptional({ example: 'Dhaka Veterinary Clinic', description: 'Clinic or hospital name' })
  @IsOptional()
  @IsString()
  clinic?: string;

  @ApiProperty({ example: '2024-01-15', description: 'Injection date (ISO format)' })
  @IsDateString()
  injectionDate!: string;

  @ApiPropertyOptional({ example: '2025-01-15', description: 'Next due date (ISO format)' })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;
}

export class UpdateVaccineDto {
  @ApiPropertyOptional({ example: 'Rabies', description: 'Vaccine name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Dose number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumber?: number;

  @ApiPropertyOptional({ example: 'Dhaka Veterinary Clinic', description: 'Clinic or hospital name' })
  @IsOptional()
  @IsString()
  clinic?: string;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Injection date (ISO format)' })
  @IsOptional()
  @IsDateString()
  injectionDate?: string;

  @ApiPropertyOptional({ example: '2025-01-15', description: 'Next due date (ISO format)' })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;
}

