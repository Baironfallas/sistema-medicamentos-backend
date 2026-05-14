import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatSessionsService } from './chat-sessions.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { UpdateChatSessionDto } from './dto/update-chat-session.dto';

@Controller('chat-sessions')
export class ChatSessionsController {
  constructor(private readonly chatSessionsService: ChatSessionsService) {}

  @Post()
  create(@Body() createChatSessionDto: CreateChatSessionDto) {
    return this.chatSessionsService.create(createChatSessionDto);
  }

  @Get()
  findAll() {
    return this.chatSessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatSessionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatSessionDto: UpdateChatSessionDto) {
    return this.chatSessionsService.update(+id, updateChatSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatSessionsService.remove(+id);
  }
}
