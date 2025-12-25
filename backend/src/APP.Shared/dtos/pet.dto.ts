import { IsNumber, IsString, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({ example: 'Buddy', description: 'Pet name' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'DOG', enum: ['DOG', 'CAT', 'BIRD', 'OTHER'], description: 'Pet type' })
  @IsEnum(['DOG', 'CAT', 'BIRD', 'OTHER'])
  type!: string;

  @ApiPropertyOptional({ example: 'Golden Retriever', description: 'Pet breed' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({ example: 'Golden', description: 'Pet color' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '2020-01-15', description: 'Date of birth (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: true, description: 'Whether the pet is neutered' })
  @IsBoolean()
  neutered!: boolean;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'UNKNOWN'], description: 'Pet gender' })
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  gender!: string;

  @ApiPropertyOptional({ example: 'Friendly and playful dog', description: 'Pet description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePetDto {
  @ApiPropertyOptional({ example: 'Buddy', description: 'Pet name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'DOG', enum: ['DOG', 'CAT', 'BIRD', 'OTHER'], description: 'Pet type' })
  @IsOptional()
  @IsEnum(['DOG', 'CAT', 'BIRD', 'OTHER'])
  type?: string;

  @ApiPropertyOptional({ example: 'Golden Retriever', description: 'Pet breed' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({ example: 'Golden', description: 'Pet color' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '2020-01-15', description: 'Date of birth (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the pet is neutered' })
  @IsOptional()
  @IsBoolean()
  neutered?: boolean;

  @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'UNKNOWN'], description: 'Pet gender' })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  gender?: string;

  @ApiPropertyOptional({ example: 'Friendly and playful dog', description: 'Pet description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ReportFoundDto {
  @ApiProperty({ example: 23.8103, description: 'Latitude where pet was found' })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 90.4125, description: 'Longitude where pet was found' })
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: '123 Main Street, Dhaka', description: 'Address where pet was found' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Found near the park', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Image URL of found pet' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: '01712345678', description: 'Contact phone number (Bangladesh format)' })
  @IsOptional()
  @IsString()
  phone?: string;
}
