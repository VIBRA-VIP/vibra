import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaType } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ConfirmMediaDto } from '../dto/confirm-media.dto';
import { CreateUploadUrlDto } from '../dto/create-upload-url.dto';
import { MediaService } from '../services/media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('health')
  health() {
    return this.mediaService.health();
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('type') typeRaw?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Selecciona una imagen desde tu dispositivo');
    }
    const type = (typeRaw as MediaType) || MediaType.GALLERY;
    return this.mediaService.uploadFile(user.id, file, type);
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  createUploadUrl(
    @CurrentUser() user: { id: string },
    @Body() body: CreateUploadUrlDto,
  ) {
    return this.mediaService.createUploadUrl(user.id, body);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  confirm(@CurrentUser() user: { id: string }, @Body() body: ConfirmMediaDto) {
    return this.mediaService.confirmUpload(user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @CurrentUser() user: { id: string },
    @Query('type') type?: MediaType,
  ) {
    return this.mediaService.listMine(user.id, type);
  }
}
