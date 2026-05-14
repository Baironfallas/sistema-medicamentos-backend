import { PartialType } from '@nestjs/swagger';
import { CreateMedicationIntakeDto } from './create-medication-intake.dto';

export class UpdateMedicationIntakeDto extends PartialType(CreateMedicationIntakeDto) {}
