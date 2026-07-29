import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PayoutProvider } from '@prisma/client';

export class CompleteProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(800)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  galleryUrls?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  messagePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  chatPricePerMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50_000)
  videoPricePerMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50_000)
  contentPrice?: number;

  @IsOptional()
  @IsBoolean()
  acceptsEncounters?: boolean;

  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean;
}

export class UpdatePayoutDto {
  @IsEnum(PayoutProvider)
  payoutProvider!: PayoutProvider;

  @IsString()
  @MinLength(6)
  @MaxLength(40)
  payoutAccount!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  payoutHolder!: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  messagePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  chatPricePerMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50_000)
  videoPricePerMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50_000)
  contentPrice?: number;

  @IsOptional()
  @IsBoolean()
  acceptsEncounters?: boolean;
}
