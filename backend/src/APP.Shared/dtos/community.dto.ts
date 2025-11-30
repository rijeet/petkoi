import { IsString, IsOptional, IsArray, IsObject, IsNumber, Min } from 'class-validator';

export class CreateCommunityPostDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateCommunityPostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CreateCommentDto {
  @IsString()
  content!: string;

  @IsString()
  @IsOptional()
  parentId?: string; // For nested comments
}

export class GetPostsDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  authorId?: string;
}

