import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  credits!: number;
}
