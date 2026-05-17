import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trimString } from 'src/common/transformers/trim-string.transformer';

export class UpdateMedicationDto {

    @ApiPropertyOptional({
        description: 'Nombre del medicamento.',
        example: 'Ibuprofeno',
        minLength: 2,
        maxLength: 100,
    })
    @Transform(trimString)
    @IsOptional()
    @IsString({ message: 'El nombre del medicamento debe ser un texto.' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres.' })
    name?: string;

    @ApiPropertyOptional({
        description: 'Dosis del medicamento.',
        example: '400mg',
        nullable: true,
        maxLength: 20,
    })
    @Transform(trimString)
    @IsOptional()
    @IsString({ message: 'La dosis debe ser un texto.' })
    @MaxLength(20, { message: 'La dosis no puede superar los 20 caracteres.' })
    dose?: string | null;

    @ApiPropertyOptional({
        description: 'Descripción adicional del medicamento.',
        example: 'Tabletas recubiertas',
        nullable: true,
        maxLength: 255,
    })
    @Transform(trimString)
    @IsOptional()
    @IsString({ message: 'La descripción debe ser un texto.' })
    @MaxLength(255, { message: 'La descripción no puede superar los 255 caracteres.' })
    description?: string | null;
}