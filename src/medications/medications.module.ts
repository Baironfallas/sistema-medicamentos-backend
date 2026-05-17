import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationsService } from './medications.service';
import { MedicationsController } from './medications.controller';
import { Medication } from './entities/medication.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { MedicationIntake } from 'src/medication-intakes/entities/medication-intake.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medication, Schedule, MedicationIntake]),
  ],
  controllers: [MedicationsController],
  providers: [MedicationsService],
})
export class MedicationsModule {}