import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min, ValidateNested, } from 'class-validator';
import { trimString } from 'src/common/transformers/trim-string.transformer';
import { normalizeLocalDate } from 'src/common/utils/local-date';
import { CreateScheduleDto } from 'src/schedules/dto/create-schedule.dto';

export class CreateMedicationDto {

    @ApiProperty({
        description: 'Nombre del medicamento.',
        example: 'Ibuprofeno',
        minLength: 2,
        maxLength: 100,
    })
    @Transform(trimString)
    @IsString({ message: 'El nombre del medicamento debe ser un texto.' })
    @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio.' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres.' })
    name!: string;

    @ApiPropertyOptional({
        description: 'Dosis del medicamento. Campo opcional.',
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
        description: 'Descripción adicional del medicamento. Campo opcional.',
        example: 'Tabletas recubiertas',
        nullable: true,
        maxLength: 255,
    })
    @Transform(trimString)
    @IsOptional()
    @IsString({ message: 'La descripción debe ser un texto.' })
    @MaxLength(255, { message: 'La descripción no puede superar los 255 caracteres.' })
    description?: string | null;

    @ApiProperty({
        description: 'Cantidad de pastillas por toma.',
        example: 1,
        minimum: 1,
    })
    @IsInt({ message: 'La cantidad por toma debe ser un número entero.' })
    @IsNotEmpty({ message: 'La cantidad por toma es obligatoria.' })
    @Min(1, { message: 'La cantidad mínima por toma es 1.' })
    quantityPerIntake!: number;

    @ApiProperty({
        description: 'Total de pastillas del sobre.',
        example: 30,
        minimum: 1,
    })
    @IsInt({ message: 'La cantidad de pastillas debe ser un número entero.' })
    @IsNotEmpty({ message: 'La cantidad de pastillas es obligatoria.' })
    @Min(1, { message: 'La cantidad mínima de pastillas es 1.' })
    totalPills!: number;

    @ApiProperty({
        description: 'Fecha de inicio del tratamiento.',
        example: '2026-05-14',
    })
    @Transform(({ value }) => normalizeLocalDate(value))
    @IsString({ message: 'La fecha de inicio debe tener el formato YYYY-MM-DD o DD/MM/YYYY.' })
    @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
    startDate!: string;

    @ApiProperty({
        description: 'Horarios de toma del medicamento.',
        type: [CreateScheduleDto],
    })
    @IsArray({ message: 'Los horarios deben ser un arreglo.' })
    @ArrayMinSize(1, { message: 'Debe registrar al menos un horario.' })
    @ValidateNested({ each: true })
    @Type(() => CreateScheduleDto)
    schedules!: CreateScheduleDto[];
}