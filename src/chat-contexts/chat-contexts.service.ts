import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { IntakeStatus } from 'src/common/enums/intake-status.enum';
import { MedicationIntake } from 'src/medication-intakes/entities/medication-intake.entity';
import { Medication } from 'src/medications/entities/medication.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChatContextsService {
  constructor(
    @InjectPinoLogger(ChatContextsService.name)
    private readonly logger: PinoLogger,

    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,

    @InjectRepository(MedicationIntake)
    private readonly medicationIntakeRepository: Repository<MedicationIntake>,
  ) { }

  async buildActiveMedicationsSummary(userId: number): Promise<string> {
    try {
      const medications = await this.medicationRepository.find({
        where: { userId },
        relations: ['schedules'],
        order: {
          createdAt: 'DESC',
        },
      });

      if (medications.length === 0) {
        return 'El usuario no tiene medicamentos registrados actualmente.';
      }

      const summaries = await Promise.all(
        medications.map(async (medication) => {
          const takenCount = await this.countTakenIntakes(
            medication.medicationId,
          );

          const consumedPills = takenCount * medication.quantityPerIntake;
          const remainingPills = medication.totalPills - consumedPills;

          if (remainingPills <= 0) {
            return null;
          }

          const schedules = medication.schedules ?? [];

          const scheduleSummary =
            schedules.length > 0
              ? schedules
                .map((schedule) => schedule.hour.substring(0, 5))
                .join(', ')
              : 'sin horarios registrados';

          const dose = medication.dose ?? 'dosis no especificada';

          const description =
            medication.description ?? 'sin descripción registrada';

          return `- ${medication.name}. Dosis: ${dose}. Cantidad por toma: ${medication.quantityPerIntake}. Pastillas restantes aproximadas: ${remainingPills}. Horarios registrados: ${scheduleSummary}. Fecha de inicio: ${medication.startDate}. Descripción: ${description}.`;
        }),
      );

      const activeSummaries = summaries.filter(
        (summary): summary is string => summary !== null,
      );

      if (activeSummaries.length === 0) {
        return 'El usuario tiene medicamentos registrados, pero no hay tratamientos activos con pastillas restantes.';
      }

      return activeSummaries.join('\n');
    } catch (error: unknown) {
      this.logger.error(
        {
          error: this.formatUnknownError(error),
          userId,
        },
        'Error al construir el contexto de medicamentos para Gemini.',
      );

      throw new InternalServerErrorException(
        'No se pudo construir el contexto de medicamentos del usuario.',
      );
    }
  }

  private async countTakenIntakes(medicationId: number): Promise<number> {
    return this.medicationIntakeRepository
      .createQueryBuilder('intake')
      .innerJoin('intake.schedule', 'schedule')
      .where('schedule.medicationId = :medicationId', { medicationId })
      .andWhere('intake.status = :status', {
        status: IntakeStatus.TAKEN,
      })
      .getCount();
  }

  private formatUnknownError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Error desconocido.';
  }
}