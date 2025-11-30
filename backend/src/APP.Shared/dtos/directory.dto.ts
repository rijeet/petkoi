import { IsString, IsOptional } from 'class-validator';

export class CreateGuardDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  address!: string;
}

export class UpdateGuardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateWasteCollectorDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  ward!: string;
}

export class UpdateWasteCollectorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  ward?: string;
}

export class FindNearbyGuardsDto {
  @IsString()
  lat!: string;

  @IsString()
  lng!: string;

  @IsString()
  @IsOptional()
  radiusKm?: string;
}

