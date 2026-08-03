import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProfileGender, UserRole } from '@prisma/client';
import { COUNTRIES } from '@vibra/shared';

const MEDIA_URL = /^(https?:\/\/.+|\/uploads\/.+)$/;
const COUNTRY_CODES = COUNTRIES.map((c) => c.code);

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsIn([UserRole.CLIENT, UserRole.MODEL])
  role!: UserRole;

  @IsIn([ProfileGender.FEMALE, ProfileGender.MALE])
  gender!: ProfileGender;

  @IsBoolean()
  acceptedTerms!: boolean;

  /** ISO date YYYY-MM-DD */
  @IsDateString()
  birthDate!: string;

  /** ISO country code from COUNTRIES list */
  @IsIn(COUNTRY_CODES)
  country!: string;

  @IsOptional()
  @IsString()
  @Matches(MEDIA_URL)
  idDocumentUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(MEDIA_URL)
  idDocumentBackUrl?: string;
}
