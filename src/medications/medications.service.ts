import { Injectable, NotFoundException, HttpException, InternalServerErrorException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Medication } from './entities/medication.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { MedicationIntake } from 'src/medication-intakes/entities/medication-intake.entity';
import { IntakeStatus } from 'src/common/enums/intake-status.enum';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { MedicationResponseDto } from './dto/medication-response.dto';
import { IntakeResponseDto } from 'src/medication-intakes/dto/intake-response.dto';
import { formatLocalDateTimeForResponse, getCurrentLocalDateTime } from 'src/common/utils/local-date-time';

@Injectable()
export class MedicationsService {

  constructor(
    @InjectPinoLogger(MedicationsService.name)
    private readonly logger: PinoLogger,

    @InjectRepository(Medication)
    private readonly medicationRepo: Repository<Medication>,


    @InjectRepository(MedicationIntake)
    private readonly intakeRepo: Repository<MedicationIntake>,

    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreateMedicationDto, userId: number): Promise<MedicationResponseDto> {
    try {
      this.logger.info({ userId }, 'Registrando nuevo medicamento');

      const medication = await this.dataSource.transaction(async (manager) => {

        // 1. Guardar medicamento
        const savedMedication = await manager.save(Medication, {
          userId,
          name: dto.name,
          dose: dto.dose ?? null,
          description: dto.description ?? null,
          quantityPerIntake: dto.quantityPerIntake,
          totalPills: dto.totalPills,
          startDate: dto.startDate,
        });

        // 2. Guardar horarios
        const savedSchedules = await manager.save(
          Schedule,
          dto.schedules.map((s) => ({
            medicationId: savedMedication.medicationId,
            hour: s.hour,
          })),
        );

        // 3. Generar solo las tomas del día de inicio
        const intakes: Partial<MedicationIntake>[] = [];

        for (const schedule of savedSchedules) {
          const timePart = schedule.hour.substring(0, 5);
          intakes.push({
            scheduleId: schedule.scheduleId,
            scheduledAt: `${dto.startDate} ${timePart}:00`,
            respondedAt: null,
            status: IntakeStatus.PENDING,
          });
        }

        await manager.save(MedicationIntake, intakes);

        this.logger.info(
          { medicationId: savedMedication.medicationId },
          'Medicamento registrado correctamente'
        );

        const medicationWithSchedules = await manager.findOne(Medication, {
          where: { medicationId: savedMedication.medicationId },
          relations: {
            schedules: true,
          },
        });

        if (!medicationWithSchedules) {
          throw new NotFoundException('Medicamento no encontrado después de crearlo.');
        }

        return medicationWithSchedules;

      });

      return this.toResponseDto(medication, 0);

    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error({ err: error.message }, 'Error al registrar medicamento');
      }
      throw new InternalServerErrorException('Ocurrió un error al registrar el medicamento.');
    }
  }

  async findAllByUser(userId: number): Promise<MedicationResponseDto[]> {
    try {
      const medications = await this.medicationRepo.find({
        where: { userId },
        relations: ['schedules'],
        order: { createdAt: 'DESC' },
      });

      return Promise.all(
        medications.map(async (medication) => {
          const takenCount = await this.countTakenIntakes(medication.medicationId);

          return this.toResponseDto(medication, takenCount);
        }),
      );

    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error({ err: error.message }, 'Error al obtener medicamentos');
      }
      throw new InternalServerErrorException('Ocurrió un error al obtener los medicamentos.');
    }
  }

  async findOneByUser(medicationId: number, userId: number): Promise<MedicationResponseDto> {
    const medication = await this.medicationRepo.findOne({
      where: { medicationId, userId },
      relations: ['schedules'],
    });

    if (!medication) {
      throw new NotFoundException('Medicamento no encontrado.');
    }

    const takenCount = await this.countTakenIntakes(medication.medicationId);

    return this.toResponseDto(medication, takenCount);
  }

  async update(medicationId: number, dto: UpdateMedicationDto, userId: number): Promise<MedicationResponseDto> {
    const medication = await this.medicationRepo.findOne({
      where: { medicationId, userId },
      relations: ['schedules'],
    });

    if (!medication) {
      throw new NotFoundException('Medicamento no encontrado.');
    }

    if (dto.name !== undefined) medication.name = dto.name;
    if (dto.dose !== undefined) medication.dose = dto.dose ?? null;
    if (dto.description !== undefined) medication.description = dto.description ?? null;

    await this.medicationRepo.save(medication);

    const takenCount = await this.countTakenIntakes(medication.medicationId);

    return this.toResponseDto(medication, takenCount);
  }

  async remove(medicationId: number, userId: number): Promise<void> {
    const medication = await this.medicationRepo.findOne({
      where: { medicationId, userId },
    });

    if (!medication) {
      throw new NotFoundException('Medicamento no encontrado.');
    }

    await this.medicationRepo.remove(medication);
  }

  async getTodayIntakes(userId: number): Promise<IntakeResponseDto[]> {
    try {

      const dateStr = getCurrentLocalDateTime().substring(0, 10);

      const intakes = await this.intakeRepo
        .createQueryBuilder('intake')
        .innerJoin('intake.schedule', 'schedule')
        .innerJoin('schedule.medication', 'medication')
        .where('medication.userId = :userId', { userId })
        .andWhere('intake.scheduledAt LIKE :date', { date: `${dateStr}%` })
        .orderBy('intake.scheduledAt', 'ASC')
        .getMany();

      return intakes.map((i) => ({
        intakeId: i.intakeId,
        scheduledAt: formatLocalDateTimeForResponse(i.scheduledAt) ?? '',
        respondedAt: formatLocalDateTimeForResponse(i.respondedAt),
        status: i.status,
      }));

    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error({ err: error.message }, 'Error al obtener tomas del día');
      }
      throw new InternalServerErrorException('Ocurrió un error al obtener las tomas del día.');
    }
  }

  private calculatePillsRemaining(medication: Medication, takenCount: number,): number {

    const consumedPills = takenCount * medication.quantityPerIntake;

    return medication.totalPills - consumedPills;
  }

  private toResponseDto(medication: Medication, takenCount: number,): MedicationResponseDto {
    const pillsRemaining = Math.max(this.calculatePillsRemaining(medication, takenCount), 0,);

    const intakesPerDay = medication.schedules?.length ?? 0;

    const daysRemaining = pillsRemaining > 0 && intakesPerDay > 0 ? Math.ceil(pillsRemaining / (intakesPerDay * medication.quantityPerIntake),) : 0;

    return {
      medicationId: medication.medicationId,
      name: medication.name,
      dose: medication.dose,
      description: medication.description,
      quantityPerIntake: medication.quantityPerIntake,
      totalPills: medication.totalPills,
      startDate: medication.startDate,
      pillsRemaining,
      daysRemaining,
      isActive: pillsRemaining > 0,
      schedules: (medication.schedules ?? []).map((s) => ({
        scheduleId: s.scheduleId,
        hour: s.hour,
      })),
    };
  }

  private async countTakenIntakes(medicationId: number): Promise<number> {
    return this.intakeRepo
      .createQueryBuilder('intake')
      .innerJoin('intake.schedule', 'schedule')
      .where('schedule.medicationId = :medicationId', { medicationId })
      .andWhere('intake.status = :status', { status: IntakeStatus.TAKEN })
      .getCount();
  }
}