import { IsNumber, IsString, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name!: string;

  @IsEnum(['DOG', 'CAT', 'BIRD', 'OTHER'])
  type!: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsBoolean()
  neutered!: boolean;

  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  gender!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['DOG', 'CAT', 'BIRD', 'OTHER'])
  type?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsBoolean()
  neutered?: boolean;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  gender?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ReportFoundDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
