import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ChatService } from '../services/chat.service';

class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('health')
  health() {
    return this.chatService.health();
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  list(@CurrentUser() user: { id: string }) {
    return this.chatService.listConversations(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('with/:peerUserId')
  openWith(
    @CurrentUser() user: { id: string },
    @Param('peerUserId') peerUserId: string,
  ) {
    return this.chatService.openWith(user.id, peerUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id/messages')
  messages(
    @CurrentUser() user: { id: string },
    @Param('id') conversationId: string,
  ) {
    return this.chatService.listMessages(user.id, conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:id/messages')
  send(
    @CurrentUser() user: { id: string },
    @Param('id') conversationId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, conversationId, body.content);
  }
}
