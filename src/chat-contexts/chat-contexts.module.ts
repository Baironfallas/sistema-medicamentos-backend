import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationIntake } from 'src/medication-intakes/entities/medication-intake.entity';
import { Medication } from 'src/medications/entities/medication.entity';
import { ChatContextsService } from './chat-contexts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Medication, MedicationIntake]),],
  providers: [ChatContextsService],
  exports: [ChatContextsService],
})
export class ChatContextsModule { }