import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '@prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PrismaService } from '../../../database/prisma.service';
import type { Env } from '../../../config/env.schema';
import { assertUploadableMediaType } from '../dto/create-upload-url.dto';
import type { ConfirmMediaDto } from '../dto/confirm-media.dto';
import type { CreateUploadUrlDto } from '../dto/create-upload-url.dto';

const FOLDER: Record<string, string> = {
  AVATAR: 'avatars',
  BANNER: 'banners',
  GALLERY: 'gallery',
  CHAT_IMAGE: 'chat',
  VIDEO: 'video',
  ID_DOCUMENT: 'id-documents',
};

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BYTES = 8 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly publicBase: string | undefined;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    this.bucket = this.config.get('S3_BUCKET', { infer: true });
    const region = this.config.get('S3_REGION', { infer: true }) ?? 'us-east-2';
    this.publicBase = this.config.get('S3_PUBLIC_BASE_URL', { infer: true });
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY', { infer: true });

    if (this.bucket && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.s3 = null;
      this.logger.warn('S3 is not fully configured; upload URLs will be unavailable');
    }
  }

  health() {
    return {
      module: 'media',
      status: 'ok',
      s3Configured: Boolean(this.s3 && this.bucket),
    };
  }

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    type: MediaType = MediaType.GALLERY,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Solo se permiten JPG, PNG, WEBP o GIF');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('La imagen no puede superar 8 MB');
    }

    try {
      assertUploadableMediaType(type);
    } catch {
      throw new BadRequestException(`Unsupported media type: ${type}`);
    }

    const folder = FOLDER[type] ?? 'other';
    const ext = extensionForMime(file.mimetype) || '.jpg';
    const key = `media/${folder}/${userId}/${Date.now()}-${randomUUID()}${ext}`;

    let publicUrl: string;

    if (this.s3 && this.bucket && this.publicBase) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );
      publicUrl = `${this.publicBase.replace(/\/$/, '')}/${key}`;
    } else {
      const relativePath = key.replace(/^media\//, '');
      const diskPath = join(process.cwd(), 'uploads', relativePath);
      await mkdir(dirname(diskPath), { recursive: true });
      await writeFile(diskPath, file.buffer);
      publicUrl = `/uploads/${relativePath}`;
    }

    const media = await this.prisma.media.create({
      data: {
        userId,
        type,
        url: publicUrl,
        key,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sortOrder: 0,
      },
    });

    if (type === MediaType.AVATAR || type === MediaType.BANNER) {
      await this.prisma.profile.updateMany({
        where: { userId },
        data: type === MediaType.AVATAR ? { avatarUrl: publicUrl } : { bannerUrl: publicUrl },
      });
    }

    return { url: publicUrl, key, mediaId: media.id, type };
  }

  async createUploadUrl(userId: string, dto: CreateUploadUrlDto) {
    if (!this.s3 || !this.bucket || !this.publicBase) {
      throw new ServiceUnavailableException('S3 media storage is not configured');
    }

    try {
      assertUploadableMediaType(dto.type);
    } catch {
      throw new BadRequestException(`Unsupported media type: ${dto.type}`);
    }

    const folder = FOLDER[dto.type] ?? 'other';
    const ext = extensionForMime(dto.mimeType);
    const safeName = dto.fileName?.replace(/[^a-zA-Z0-9._-]/g, '') || `${randomUUID()}${ext}`;
    const key = `media/${folder}/${userId}/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.mimeType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });
    const publicUrl = `${this.publicBase.replace(/\/$/, '')}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      headers: { 'Content-Type': dto.mimeType },
      expiresInSeconds: 300,
    };
  }

  async confirmUpload(userId: string, dto: ConfirmMediaDto) {
    if (!dto.key.startsWith(`media/`) || !dto.key.includes(`/${userId}/`)) {
      throw new BadRequestException('Invalid media key for user');
    }

    const media = await this.prisma.media.create({
      data: {
        userId,
        type: dto.type,
        url: dto.url,
        key: dto.key,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    if (dto.type === MediaType.AVATAR || dto.type === MediaType.BANNER) {
      await this.prisma.profile.updateMany({
        where: { userId },
        data:
          dto.type === MediaType.AVATAR
            ? { avatarUrl: dto.url }
            : { bannerUrl: dto.url },
      });
    }

    return media;
  }

  listMine(userId: string, type?: MediaType) {
    return this.prisma.media.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'video/mp4':
      return '.mp4';
    case 'video/webm':
      return '.webm';
    default:
      return '';
  }
}
