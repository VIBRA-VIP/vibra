import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProfileGender, UserRole } from '@prisma/client';

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
}
