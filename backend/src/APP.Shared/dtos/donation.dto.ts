import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DonationMethod {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  BANK = 'BANK',
  PAYPAL = 'PAYPAL',
  OTHER = 'OTHER',
}

export enum DonationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export class CreateDonationDto {
  @ApiProperty({ example: 'BKASH', enum: DonationMethod, description: 'Payment method' })
  @IsEnum(DonationMethod)
  method!: DonationMethod;

  @ApiProperty({ example: 500, minimum: 1, description: 'Donation amount in BDT' })
  @IsInt()
  @Min(1)
  amountBDT!: number;

  @ApiProperty({ example: 'TRX123456789', description: 'Transaction ID' })
  @IsString()
  @IsNotEmpty()
  trxId!: string;

  @ApiProperty({ example: '01712345678', description: 'Agent account number' })
  @IsString()
  @IsNotEmpty()
  agentAccount!: string;

  @ApiPropertyOptional({ example: '01712345678', description: 'Contact number' })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: 'Thank you for supporting our cause!', description: 'Optional note' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class VerifyDonationDto {
  @ApiProperty({ example: 'VERIFIED', enum: DonationStatus, description: 'Verification status' })
  @IsEnum(DonationStatus)
  status!: DonationStatus;

  @ApiPropertyOptional({ example: 'Payment verified successfully', description: 'Admin note' })
  @IsOptional()
  @IsString()
  note?: string;
}

