import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProfileGender, UserRole } from '@prisma/client';

const MEDIA_URL = /^(https?:\/\/.+|\/uploads\/.+)$/;

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

  /** Required for MODEL at register time (validated in service). */
  @IsOptional()
  @IsString()
  @Matches(MEDIA_URL)
  idDocumentUrl?: string;
}
