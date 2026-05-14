import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    MinLength,
} from 'class-validator';
import { trimString } from 'src/common/transformers/trim-string.transformer';

export class RegisterDto {
    @ApiProperty({
        description: 'Número de identificación único del usuario.',
        example: '123456789',
        minLength: 6,
        maxLength: 20,
    })
    @Transform(trimString)
    @IsString({ message: 'La identificación debe ser un texto.' })
    @IsNotEmpty({ message: 'La identificación es obligatoria.' })
    @Length(6, 20, {
        message: 'La identificación debe tener entre 6 y 20 caracteres.',
    })
    identification!: string;

    @ApiProperty({
        description: 'Primer nombre del usuario.',
        example: 'Juan',
        minLength: 2,
        maxLength: 20,
    })
    @Transform(trimString)
    @IsString({ message: 'El primer nombre debe ser un texto.' })
    @IsNotEmpty({ message: 'El primer nombre es obligatorio.' })
    @Length(2, 20, {
        message: 'El primer nombre debe tener entre 2 y 20 caracteres.',
    })
    firstName!: string;

    @ApiPropertyOptional({
        description: 'Segundo nombre del usuario. Este campo es opcional.',
        example: 'Carlos',
        nullable: true,
        minLength: 2,
        maxLength: 20,
    })
    @Transform(trimString)
    @IsOptional()
    @IsString({ message: 'El segundo nombre debe ser un texto.' })
    @Length(2, 20, {
        message: 'El segundo nombre debe tener entre 2 y 20 caracteres.',
    })
    secondName?: string | null;

    @ApiProperty({
        description: 'Primer apellido del usuario.',
        example: 'Pérez',
        minLength: 2,
        maxLength: 30,
    })
    @Transform(trimString)
    @IsString({ message: 'El primer apellido debe ser un texto.' })
    @IsNotEmpty({ message: 'El primer apellido es obligatorio.' })
    @Length(2, 30, {
        message: 'El primer apellido debe tener entre 2 y 30 caracteres.',
    })
    firstLastName!: string;

    @ApiPropertyOptional({
        description: 'Segundo apellido del usuario. Este campo es opcional.',
        example: 'Gómez',
        nullable: true,
        minLength: 2,
        maxLength: 30,
    })
    @Transform(trimString)
    @IsOptional()
    @IsString({ message: 'El segundo apellido debe ser un texto.' })
    @Length(2, 30, {
        message: 'El segundo apellido debe tener entre 2 y 30 caracteres.',
    })
    secondLastName?: string | null;

    @ApiProperty({
        description: 'Correo electrónico único del usuario.',
        example: 'juan.perez@gmail.com',
    })
    @Transform(trimString)
    @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido.' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
    email!: string;

    @ApiProperty({
        description: 'Contraseña del usuario. Debe tener al menos 8 caracteres.',
        example: 'Password123',
        minLength: 8,
    })
    @IsString({ message: 'La contraseña debe ser un texto.' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
    @MinLength(8, {
        message: 'La contraseña debe tener al menos 8 caracteres.',
    })
    password!: string;
}