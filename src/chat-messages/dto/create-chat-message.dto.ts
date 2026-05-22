import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from 'src/common/transformers/trim-string.transformer';

export class CreateChatMessageDto {

    @ApiProperty({
        description: 'Contenido del mensaje enviado por el usuario.',
        example: '¿Puedo tomarlo con el estómago vacío?',
        maxLength: 2000,
    })
    @Transform(trimString)
    @IsString({ message: 'El mensaje debe ser un texto.' })
    @IsNotEmpty({ message: 'El mensaje no puede estar vacío.' })
    @MaxLength(2000, { message: 'El mensaje no puede superar los 2000 caracteres.' })
    content!: string;
}