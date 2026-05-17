import { BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { IntakeStatus } from 'src/common/enums/intake-status.enum';
import { getCurrentLocalDateTime } from 'src/common/utils/local-date-time';
import { ConfirmIntakeDto } from './dto/confirm-intake.dto';
import { IntakeResponseDto } from './dto/intake-response.dto';
import { MedicationIntake } from './entities/medication-intake.entity';
import { IntakeSchedulerService } from './intake-scheduler.service';

@Injectable()
export class MedicationIntakesService {
  constructor(
    @InjectPinoLogger(MedicationIntakesService.name)
    private readonly logger: PinoLogger,

    @InjectRepository(MedicationIntake)
    private readonly intakeRepo: Repository<MedicationIntake>,

    private readonly intakeSchedulerService: IntakeSchedulerService,
  ) { }

  async confirm(intakeId: number, dto: ConfirmIntakeDto, userId: number,): Promise<IntakeResponseDto> {
    try {
      const intake = await this.intakeRepo.findOne({
        where: { intakeId },
        relations: {
          schedule: {
            medication: true,
          },
        },
      });

      if (!intake) {
        throw new NotFoundException('Toma no encontrada.');
      }

      if (intake.schedule.medication.userId !== userId) {
        throw new ForbiddenException('No tienes permiso para modificar esta toma.');
      }

      const savedIntake = await this.changePendingStatus(
        intake,
        dto.status,
      );

      if (savedIntake.status === IntakeStatus.OMITTED) {
        await this.intakeSchedulerService.generateExtraIntakeAfterOmission(savedIntake);
      }

      this.logger.info(
        {
          intakeId: savedIntake.intakeId,
          userId,
          status: savedIntake.status,
        },
        'Toma confirmada correctamente',
      );

      return this.toResponseDto(savedIntake);

    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      if (error instanceof Error) {
        this.logger.error(
          { err: error.message, intakeId, userId },
          'Error al confirmar toma o generar reposición',
        );
      }

      throw new InternalServerErrorException('Ocurrió un error al confirmar la toma.');
    }
  }

  async markAsOmittedBySystem(intake: MedicationIntake): Promise<MedicationIntake> {
    return this.changePendingStatus(intake, IntakeStatus.OMITTED);
  }

  private async changePendingStatus(
    intake: MedicationIntake,
    status: IntakeStatus.TAKEN | IntakeStatus.OMITTED,
  ): Promise<MedicationIntake> {
    if (intake.status !== IntakeStatus.PENDING) {
      throw new BadRequestException('Esta toma ya fue respondida.');
    }

    intake.status = status;
    intake.respondedAt = getCurrentLocalDateTime();



    return this.intakeRepo.save(intake);
  }


  private toResponseDto(intake: MedicationIntake): IntakeResponseDto {
    return {
      intakeId: intake.intakeId,
      scheduledAt: intake.scheduledAt,
      respondedAt: intake.respondedAt,
      status: intake.status,
    };
  }
}