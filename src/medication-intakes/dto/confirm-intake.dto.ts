import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { IntakeStatus } from 'src/common/enums/intake-status.enum';

export class ConfirmIntakeDto {

    @ApiProperty({
        description: 'Estado de la toma.',
        enum: [IntakeStatus.TAKEN, IntakeStatus.OMITTED],
        example: IntakeStatus.TAKEN,
    })
    @IsEnum([IntakeStatus.TAKEN, IntakeStatus.OMITTED], {
        message: 'El estado debe ser taken u omitted.',
    })
    @IsNotEmpty({ message: 'El estado es obligatorio.' })
    status!: IntakeStatus.TAKEN | IntakeStatus.OMITTED;
}