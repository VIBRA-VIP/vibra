import { PostVisibility } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PostMediaItemDto {
  @IsString()
  url!: string;

  @IsIn(['IMAGE', 'VIDEO'])
  kind!: 'IMAGE' | 'VIDEO';
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  @IsEnum(PostVisibility)
  visibility!: PostVisibility;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000)
  priceCredits?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => PostMediaItemDto)
  media!: PostMediaItemDto[];
}

export class CreateCommentDto {
  @IsString()
  @MaxLength(500)
  text!: string;
}
