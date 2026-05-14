import { UserRole } from 'src/common/enums/user-role.enum';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ name: 'user_id' })
    userId!: number;

    @Column({ length: 20, unique: true })
    identification!: string;

    @Column({ name: 'first_name', length: 20 })
    firstName!: string;

    @Column({ name: 'second_name', type: 'varchar', length: 20, nullable: true })
    secondName!: string | null;

    @Column({ name: 'first_last_name', length: 30 })
    firstLastName!: string;

    @Column({ name: 'second_last_name', type: 'varchar', length: 30, nullable: true })
    secondLastName!: string | null;

    @Column({ length: 150, unique: true })
    email!: string;

    @Exclude()
    @Column({ length: 150, select: false })
    password!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role!: UserRole

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
    })
    createdAt!: Date;

}
