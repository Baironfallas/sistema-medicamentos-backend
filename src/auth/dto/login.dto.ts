import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { trimString } from 'src/common/transformers/trim-string.transformer';

export class LoginDto {
    @ApiProperty({
        description: 'Correo electrónico del usuario.',
        example: 'juan.perez@gmail.com',
    })
    @Transform(trimString)
    @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido.' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
    email!: string;

    @ApiProperty({
        description: 'Contraseña del usuario.',
        example: 'Password123',
    })
    @IsString({ message: 'La contraseña debe ser un texto.' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
    password!: string;
}