import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

const ALLOWED: ReadonlySet<MediaType> = new Set([
  MediaType.AVATAR,
  MediaType.BANNER,
  MediaType.GALLERY,
  MediaType.CHAT_IMAGE,
  MediaType.ID_DOCUMENT,
  MediaType.VIDEO,
]);

export class CreateUploadUrlDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  @Matches(/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm))$/)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+$/)
  fileName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  sizeBytes?: number;
}

export function assertUploadableMediaType(type: MediaType): void {
  if (!ALLOWED.has(type)) {
    throw new Error(`Media type ${type} is not uploadable`);
  }
}
