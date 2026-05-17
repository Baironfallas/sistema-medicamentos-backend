import { Module } from '@nestjs/common';
import { ChatSessionsService } from './chat-sessions.service';
import { ChatSessionsController } from './chat-sessions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession])],
  controllers: [ChatSessionsController],
  providers: [ChatSessionsService],
  exports: [TypeOrmModule],
})
export class ChatSessionsModule { }
