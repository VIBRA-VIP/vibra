import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PayoutAccountType } from '@prisma/client';
import { COLOMBIA_PAYOUT_OPTIONS } from '@vibra/shared';

const BANK_IDS = COLOMBIA_PAYOUT_OPTIONS.map((b) => b.id);

/** Absolute URL or local/proxied upload path */
const MEDIA_URL = /^(https?:\/\/.+|\/uploads\/.+)$/;

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
  @IsString()
  @Matches(MEDIA_URL)
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(MEDIA_URL, { each: true })
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
  @IsInt()
  @IsIn(BANK_IDS)
  payoutBankId!: number;

  @IsEnum(PayoutAccountType)
  payoutAccountType!: PayoutAccountType;

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
  @IsString()
  @Matches(MEDIA_URL)
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
