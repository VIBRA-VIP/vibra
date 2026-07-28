import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

export class ConfirmMediaDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  key!: string;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  sizeBytes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
