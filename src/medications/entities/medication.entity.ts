import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';

@Entity('medications')
export class Medication {

    @PrimaryGeneratedColumn({ name: 'medication_id' })
    medicationId!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @ManyToOne(() => User, (user) => user.medications, {
        nullable: false,
        eager: false,
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT',
    })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    dose!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description!: string | null;

    @Column({ name: 'quantity_per_intake', type: 'int', unsigned: true })
    quantityPerIntake!: number;

    @Column({ name: 'total_pills', type: 'int', unsigned: true })
    totalPills!: number;

    @Column({ name: 'start_date', type: 'date' })
    startDate!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @OneToMany(() => Schedule, (schedule) => schedule.medication)
    schedules!: Schedule[];
}