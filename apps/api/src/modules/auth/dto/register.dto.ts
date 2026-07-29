import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
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

  @ValidateIf((o: RegisterDto) => o.role === UserRole.MODEL)
  @IsEnum(ProfileGender)
  gender?: ProfileGender;

  @IsBoolean()
  acceptedTerms!: boolean;
}
