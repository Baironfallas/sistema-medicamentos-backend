import { Injectable } from '@nestjs/common';
import { CreateMedicationIntakeDto } from './dto/create-medication-intake.dto';
import { UpdateMedicationIntakeDto } from './dto/update-medication-intake.dto';

@Injectable()
export class MedicationIntakesService {
  create(createMedicationIntakeDto: CreateMedicationIntakeDto) {
    return 'This action adds a new medicationIntake';
  }

  findAll() {
    return `This action returns all medicationIntakes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} medicationIntake`;
  }

  update(id: number, updateMedicationIntakeDto: UpdateMedicationIntakeDto) {
    return `This action updates a #${id} medicationIntake`;
  }

  remove(id: number) {
    return `This action removes a #${id} medicationIntake`;
  }
}
