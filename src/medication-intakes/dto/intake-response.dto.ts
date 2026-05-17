import { IntakeStatus } from 'src/common/enums/intake-status.enum';

export class IntakeResponseDto {
    intakeId!: number;
    scheduledAt!: string;
    respondedAt!: string | null;
    status!: IntakeStatus;
}