import {Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,} from 'typeorm';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { IntakeStatus } from '../../common/enums/intake-status.enum';

@Entity('medication_intakes')
@Index('uq_intake_schedule_scheduled_at', ['scheduleId', 'scheduledAt'], {
    unique: true,
})
export class MedicationIntake {

    @PrimaryGeneratedColumn({ name: 'intake_id' })
    intakeId!: number;

    @Column({ name: 'schedule_id' })
    scheduleId!: number;

    @ManyToOne(() => Schedule, (schedule) => schedule.intakes, {
        nullable: false,
        eager: false,
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
    })
    @JoinColumn({ name: 'schedule_id' })
    schedule!: Schedule;

    @Column({ name: 'scheduled_at', type: 'datetime' })
    scheduledAt!: string;

    @Column({ name: 'responded_at', type: 'datetime', nullable: true })
    respondedAt!: string | null;

    @Column({
        type: 'enum',
        enum: IntakeStatus,
        default: IntakeStatus.PENDING,
    })
    status!: IntakeStatus;
}