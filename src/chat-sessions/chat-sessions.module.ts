import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionsController } from './chat-sessions.controller';
import { ChatSessionsService } from './chat-sessions.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from 'src/chat-messages/entities/chat-message.entity';
import { GeminiModule } from 'src/gemini/gemini.module';
import { ChatContextsModule } from 'src/chat-contexts/chat-contexts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage,]),
    GeminiModule,
    ChatContextsModule,
  ],
  controllers: [ChatSessionsController],
  providers: [ChatSessionsService],
  exports: [ChatSessionsService],
})
export class ChatSessionsModule { }