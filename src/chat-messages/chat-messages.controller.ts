import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags, } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessageExchangeResponseDto } from './dto/chat-message-exchange-response.dto';
import { ChatMessageResponseDto } from './dto/chat-message-response.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@ApiBearerAuth()
@ApiTags('chat-messages')
@UseGuards(JwtAuthGuard)
@Controller('chat-sessions/:sessionId/messages')
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) { }

  @Post()
  @ApiCreatedResponse({ type: ChatMessageExchangeResponseDto })
  create(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CreateChatMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatMessageExchangeResponseDto> {
    return this.chatMessagesService.create(sessionId, dto, user.userId);
  }

  @Get()
  @ApiOkResponse({ type: [ChatMessageResponseDto] })
  findBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatMessageResponseDto[]> {
    return this.chatMessagesService.findMessagesBySession(
      sessionId,
      user.userId,
    );
  }
}