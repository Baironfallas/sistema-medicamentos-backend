import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {  IsNotEmpty, IsString } from 'class-validator';
import { normalizeLocalTime } from 'src/common/utils/local-time';

export class CreateScheduleDto {

    @ApiProperty({
        description: 'Hora de la toma en formato 12 o 24 horas.',
        example: '06:00 AM',
    })
    @Transform(({ value }) => normalizeLocalTime(value))
    @IsString({ message: 'La hora debe ser un texto.' })
    @IsNotEmpty({ message: 'La hora es obligatoria.' })
    hour!: string;

    
}