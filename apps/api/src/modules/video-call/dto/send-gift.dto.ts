import { IsString, MinLength } from 'class-validator';

export class SendGiftDto {
  @IsString()
  @MinLength(1)
  giftId!: string;
}
