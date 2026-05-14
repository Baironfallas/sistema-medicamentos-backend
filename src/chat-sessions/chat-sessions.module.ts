import { Module } from '@nestjs/common';
import { ChatSessionsService } from './chat-sessions.service';
import { ChatSessionsController } from './chat-sessions.controller';

@Module({
  controllers: [ChatSessionsController],
  providers: [ChatSessionsService],
})
export class ChatSessionsModule {}
