import { Module } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessage } from './entities/chat-message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from 'src/chat-sessions/entities/chat-session.entity';
import { GeminiModule } from 'src/gemini/gemini.module';
import { ChatContextsModule } from 'src/chat-contexts/chat-contexts.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, ChatSession]),
    GeminiModule,
    ChatContextsModule,
  ],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService],
  exports: [ChatMessagesService],
})
export class ChatMessagesModule { }
