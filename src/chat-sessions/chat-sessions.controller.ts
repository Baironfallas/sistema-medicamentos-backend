import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags, } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ChatSessionsService } from './chat-sessions.service';
import { ChatSessionDetailResponseDto } from './dto/chat-session-detail-response.dto';
import { ChatSessionResponseDto } from './dto/chat-session-response.dto';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';

@ApiBearerAuth()
@ApiTags('chat-sessions')
@UseGuards(JwtAuthGuard)
@Controller('chat-sessions')
export class ChatSessionsController {
  constructor(private readonly chatSessionsService: ChatSessionsService) { }

  @Post()
  @ApiCreatedResponse({ type: ChatSessionDetailResponseDto })
  create(
    @Body() dto: CreateChatSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatSessionDetailResponseDto> {
    return this.chatSessionsService.create(dto, user.userId);
  }

  @Get()
  @ApiOkResponse({ type: [ChatSessionResponseDto] })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatSessionResponseDto[]> {
    return this.chatSessionsService.findAllByUser(user.userId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ChatSessionDetailResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatSessionDetailResponseDto> {
    return this.chatSessionsService.findOneByUser(id, user.userId);
  }
}