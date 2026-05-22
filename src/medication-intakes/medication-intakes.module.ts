import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationIntake } from './entities/medication-intake.entity';
import { MedicationIntakesController } from './medication-intakes.controller';
import { MedicationIntakesCronService } from './medication-intakes-cron.service';
import { MedicationIntakesService } from './medication-intakes.service';
import { IntakeSchedulerService } from './intake-scheduler.service';
import { Schedule } from 'src/schedules/entities/schedule.entity';


@Module({
  imports: [TypeOrmModule.forFeature([MedicationIntake, Schedule])],
  controllers: [MedicationIntakesController],
  providers: [
    MedicationIntakesService,
    MedicationIntakesCronService,
    IntakeSchedulerService
  ],
  exports: [MedicationIntakesService],
})
export class MedicationIntakesModule { }