import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageResponseDto } from 'src/chat-messages/dto/chat-message-response.dto';
import { ChatSessionResponseDto } from './chat-session-response.dto';

export class ChatSessionDetailResponseDto {
    @ApiProperty({ type: ChatSessionResponseDto })
    session!: ChatSessionResponseDto;

    @ApiProperty({ type: [ChatMessageResponseDto] })
    messages!: ChatMessageResponseDto[];
}