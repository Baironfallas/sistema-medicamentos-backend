import { ScheduleResponseDto } from "src/schedules/dto/schedule-response.dto";

export class MedicationResponseDto {
    medicationId!: number;
    name!: string;
    dose!: string | null;
    description!: string | null;
    quantityPerIntake!: number;
    totalPills!: number;
    startDate!: string;
    pillsRemaining!: number;
    daysRemaining!: number;
    isActive!: boolean;
    schedules!: ScheduleResponseDto[];
}