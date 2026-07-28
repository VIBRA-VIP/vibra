import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username solo permite letras, números y _' })
  username!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
