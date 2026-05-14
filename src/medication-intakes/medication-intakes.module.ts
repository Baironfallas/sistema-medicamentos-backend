import { Module } from '@nestjs/common';
import { MedicationIntakesService } from './medication-intakes.service';
import { MedicationIntakesController } from './medication-intakes.controller';

@Module({
  controllers: [MedicationIntakesController],
  providers: [MedicationIntakesService],
})
export class MedicationIntakesModule {}
