import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { IntakeStatus } from 'src/common/enums/intake-status.enum';
import { getCurrentLocalDateTime } from 'src/common/utils/local-date-time';
import { MedicationIntake } from './entities/medication-intake.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { Medication } from 'src/medications/entities/medication.entity';

@Injectable()
export class IntakeSchedulerService {

    constructor(
        @InjectPinoLogger(IntakeSchedulerService.name)
        private readonly logger: PinoLogger,

        @InjectRepository(MedicationIntake)
        private readonly intakeRepo: Repository<MedicationIntake>,

        @InjectRepository(Schedule)
        private readonly scheduleRepo: Repository<Schedule>,

    ) { }

    // Genera las tomas del día siguiente para todos los medicamentos activos
    async generateNextDayIntakes(): Promise<void> {
        const tomorrow = this.getDateString(1);

        // Busca todos los medicamentos que tienen horarios
        const schedules = await this.scheduleRepo
            .createQueryBuilder('schedule')
            .innerJoinAndSelect('schedule.medication', 'medication')
            .orderBy('schedule.hour', 'ASC')
            .getMany();

        // Agrupa horarios por medicamento
        const schedulesByMedication = new Map<number, { medication: Medication; schedules: Schedule[] }>();

        for (const schedule of schedules) {
            const medicationId = schedule.medication.medicationId;
            if (!schedulesByMedication.has(medicationId)) {
                schedulesByMedication.set(medicationId, {
                    medication: schedule.medication,
                    schedules: [],
                });
            }
            schedulesByMedication.get(medicationId)!.schedules.push(schedule);
        }

        for (const [medicationId, { medication, schedules: medSchedules }] of schedulesByMedication) {
            const pillsRemaining = await this.calculatePillsRemaining(medication);
            const remainingIntakes = this.getRemainingIntakesCount(
                medication,
                pillsRemaining,
            );

            if (remainingIntakes <= 0) {
                this.logger.info(
                    { medicationId },
                    'Medicamento finalizado, no se generan tomas para mañana',
                );
                continue;
            }

            const intakesToCreate: Partial<MedicationIntake>[] = [];

            for (const schedule of medSchedules) {
                if (intakesToCreate.length >= remainingIntakes) {
                    break;
                }

                const timePart = schedule.hour.substring(0, 5);
                const scheduledAt = `${tomorrow} ${timePart}:00`;

                const exists = await this.intakeAlreadyExists(
                    schedule.scheduleId,
                    scheduledAt,
                );

                if (exists) {
                    this.logger.info(
                        {
                            medicationId,
                            scheduleId: schedule.scheduleId,
                            scheduledAt,
                        },
                        'No se generó toma porque ya existe',
                    );
                    continue;
                }

                intakesToCreate.push({
                    scheduleId: schedule.scheduleId,
                    scheduledAt,
                    respondedAt: null,
                    status: IntakeStatus.PENDING,
                });
            }
            if (intakesToCreate.length === 0) {
                continue;
            }

            await this.intakeRepo.save(intakesToCreate);

            this.logger.info(
                { medicationId, tomorrow, count: intakesToCreate.length },
                'Tomas del día siguiente generadas',
            );
        }
    }

    // Genera una toma extra al final del tratamiento cuando una toma fue omitida
    async generateExtraIntakeAfterOmission(intake: MedicationIntake): Promise<void> {
        const schedule = await this.scheduleRepo.findOne({
            where: { scheduleId: intake.scheduleId },
            relations: { medication: true },
        });

        if (!schedule) {
            return;
        }

        const pillsRemaining = await this.calculatePillsRemaining(schedule.medication);
        const remainingIntakes = this.getRemainingIntakesCount(
            schedule.medication,
            pillsRemaining,
        );
        if (remainingIntakes <= 0) {
            this.logger.info(
                { intakeId: intake.intakeId },
                'Medicamento finalizado, no se genera toma extra',
            );
            return;
        }


        // Busca la última toma programada de este horario
        const lastIntakeRaw = await this.intakeRepo
            .createQueryBuilder('intake')
            .select("DATE_FORMAT(MAX(intake.scheduledAt), '%Y-%m-%d')", 'lastDate')
            .where('intake.scheduleId = :scheduleId', {
                scheduleId: intake.scheduleId,
            })
            .getRawOne<{ lastDate: string | null }>();

        if (!lastIntakeRaw?.lastDate) {
            return;
        }
        // Suma un día a la última toma programada
        const nextDate = this.addDays(lastIntakeRaw.lastDate, 1);
        const timePart = schedule.hour.substring(0, 5);
        const scheduledAt = `${nextDate} ${timePart}:00`;

        const exists = await this.intakeAlreadyExists(
            schedule.scheduleId,
            scheduledAt,
        );

        if (exists) {
            this.logger.info(
                {
                    intakeId: intake.intakeId,
                    scheduleId: schedule.scheduleId,
                    scheduledAt,
                },
                'No se generó toma extra porque ya existe',
            );
            return;
        }


        await this.intakeRepo.save({
            scheduleId: schedule.scheduleId,
            scheduledAt,
            respondedAt: null,
            status: IntakeStatus.PENDING,
        });

        this.logger.info(
            {
                intakeId: intake.intakeId,
                newScheduledAt: scheduledAt,
            },
            'Toma extra generada por omisión',
        );
    }

    async calculatePillsRemaining(medication: Medication): Promise<number> {
        const takenCount = await this.intakeRepo
            .createQueryBuilder('intake')
            .innerJoin('intake.schedule', 'schedule')
            .where('schedule.medicationId = :medicationId', { medicationId: medication.medicationId })
            .andWhere('intake.status = :status', { status: IntakeStatus.TAKEN })
            .getCount();

        return medication.totalPills - (takenCount * medication.quantityPerIntake);
    }

    private async intakeAlreadyExists(
        scheduleId: number,
        scheduledAt: string,
    ): Promise<boolean> {
        return this.intakeRepo.exists({
            where: {
                scheduleId,
                scheduledAt,
            },
        });
    }

    private getRemainingIntakesCount(medication: Medication, pillsRemaining: number): number {
        return Math.floor(pillsRemaining / medication.quantityPerIntake);
    }

    private getDateString(daysFromNow: number): string {
        const today = getCurrentLocalDateTime().substring(0, 10);
        return this.addDays(today, daysFromNow);
    }

    private addDays(dateStr: string, days: number): string {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day + days);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }


}