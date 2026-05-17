import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { IntakeStatus } from 'src/common/enums/intake-status.enum';
import { getCurrentLocalDateTime, subtractHoursFromLocalDateTime, } from 'src/common/utils/local-date-time';
import { MedicationIntake } from './entities/medication-intake.entity';
import { MedicationIntakesService } from './medication-intakes.service';
import { IntakeSchedulerService } from './intake-scheduler.service';

@Injectable()
export class MedicationIntakesCronService {
    constructor(
        @InjectPinoLogger(MedicationIntakesCronService.name)
        private readonly logger: PinoLogger,

        @InjectRepository(MedicationIntake)
        private readonly intakeRepo: Repository<MedicationIntake>,

        private readonly medicationIntakesService: MedicationIntakesService,
        private readonly intakeSchedulerService: IntakeSchedulerService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)

    async markExpiredPendingIntakesAsOmitted(): Promise<void> {
        const now = getCurrentLocalDateTime();
        const expirationLimit = subtractHoursFromLocalDateTime(now, 2);

        const expiredIntakes = await this.intakeRepo
            .createQueryBuilder('intake')
            .leftJoinAndSelect('intake.schedule', 'schedule')
            .leftJoinAndSelect('schedule.medication', 'medication')
            .where('intake.status = :status', { status: IntakeStatus.PENDING })
            .andWhere('intake.scheduledAt <= :expirationLimit', { expirationLimit })
            .getMany();


        this.logger.info(
            {
                now,
                expirationLimit,
                expiredIntakes: expiredIntakes.map((intake) => ({
                    intakeId: intake.intakeId,
                    scheduledAt: intake.scheduledAt,
                    status: intake.status,
                })),
            },
            'Verificando tomas pendientes vencidas',
        );

        if (expiredIntakes.length === 0) {
            return;
        }

        for (const intake of expiredIntakes) {
            try {
                await this.medicationIntakesService.markAsOmittedBySystem(intake);
                await this.intakeSchedulerService.generateExtraIntakeAfterOmission(intake);
                this.logger.info(
                    {
                        intakeId: intake.intakeId,
                        scheduledAt: intake.scheduledAt,
                    },
                    'Toma vencida marcada como omitida y reposición generada',
                );

            } catch (error: unknown) {
                if (error instanceof Error) {
                    this.logger.error(
                        {
                            err: error.message,
                            intakeId: intake.intakeId,
                        },
                        'Error al marcar toma vencida como omitida',
                    );
                }
            }
        }
    }


}