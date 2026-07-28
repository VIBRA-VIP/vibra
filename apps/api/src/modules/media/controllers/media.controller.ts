import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MediaType } from '@prisma/client';
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
