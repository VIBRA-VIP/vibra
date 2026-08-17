import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ExtendVideoCallDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  minutes!: number;
}
