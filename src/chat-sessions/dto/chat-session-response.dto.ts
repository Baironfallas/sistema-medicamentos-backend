import { ApiProperty } from '@nestjs/swagger';

export class ChatSessionResponseDto {

    @ApiProperty({ example: 1 })
    sessionId!: number;

    @ApiProperty({ example: '¿Para qué sirve el Ibuprofeno?' })
    title!: string | null;

    @ApiProperty({ example: '2026-05-17T10:00:00' })
    startedAt!: string;

    @ApiProperty({ example: '2026-05-17T10:05:00' })
    lastActivity!: string;
}