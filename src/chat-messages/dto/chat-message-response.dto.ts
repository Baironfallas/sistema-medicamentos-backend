import { ApiProperty } from '@nestjs/swagger';
import { MessageSender } from 'src/common/enums/message-sender.enum';

export class ChatMessageResponseDto {

    @ApiProperty({ example: 1 })
    messageId!: number;

    @ApiProperty({ enum: MessageSender, example: MessageSender.USER })
    sender!: MessageSender;

    @ApiProperty({ example: '¿Para qué sirve el Ibuprofeno?' })
    content!: string;

    @ApiProperty({ example: '2026-05-17T10:00:00' })
    sentAt!: string;
}