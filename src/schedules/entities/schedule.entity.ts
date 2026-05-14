import { Column, Entity, JoinColumn, ManyToOne, OneToMany,PrimaryGeneratedColumn} from 'typeorm';
import { Medication } from 'src/medications/entities/medication.entity';
import { MedicationIntake } from 'src/medication-intakes/entities/medication-intake.entity';

@Entity('schedules')
export class Schedule {

    @PrimaryGeneratedColumn({ name: 'schedule_id' })
    scheduleId!: number;

    @Column({ name: 'medication_id' })
    medicationId!: number;

    @ManyToOne(() => Medication, (medication) => medication.schedules, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
})
    @JoinColumn({ name: 'medication_id' })
    medication!: Medication;

    @Column({ type: 'time' })
    hour!: string;

    @Column({ name: 'interval_hours', type: 'int', unsigned: true, nullable: true })
    intervalHours!: number | null;

    @OneToMany(() => MedicationIntake, (intake) => intake.schedule)
    intakes!: MedicationIntake[];
}