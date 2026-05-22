import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageResponseDto } from './chat-message-response.dto';

export class ChatMessageExchangeResponseDto {
    @ApiProperty({ type: ChatMessageResponseDto })
    userMessage!: ChatMessageResponseDto;

    @ApiProperty({ type: ChatMessageResponseDto })
    assistantMessage!: ChatMessageResponseDto;
}