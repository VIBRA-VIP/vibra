import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateVideoCallDto } from '../dto/create-video-call.dto';
import { ExtendVideoCallDto } from '../dto/extend-video-call.dto';
import { SendGiftDto } from '../dto/send-gift.dto';
import { VideoCallService } from '../services/video-call.service';

@Controller('video-call')
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('health')
  health() {
    return this.videoCallService.health();
  }

  @UseGuards(JwtAuthGuard)
  @Get('gifts')
  gifts() {
    return this.videoCallService.listGifts();
  }

  @UseGuards(JwtAuthGuard)
  @Get('ice-config')
  iceConfig() {
    return this.videoCallService.iceConfig();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() body: CreateVideoCallDto,
  ) {
    return this.videoCallService.create(user.id, body.modelId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  pending(@CurrentUser() user: { id: string }) {
    return this.videoCallService.listPending(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoCallService.getOne(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  accept(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoCallService.accept(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/decline')
  decline(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoCallService.decline(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/extend')
  extend(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ExtendVideoCallDto,
  ) {
    return this.videoCallService.extend(user.id, id, body.minutes);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/end')
  end(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoCallService.end(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/gifts')
  sendGift(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendGiftDto,
  ) {
    return this.videoCallService.sendGift(user.id, id, body.giftId);
  }
}
