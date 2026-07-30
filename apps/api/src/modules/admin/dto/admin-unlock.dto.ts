import { IsString, MinLength } from 'class-validator';

export class AdminUnlockDto {
  @IsString()
  @MinLength(8)
  key!: string;
}
