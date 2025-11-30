import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateGPSLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class GetGPSHistoryDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 100;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}

