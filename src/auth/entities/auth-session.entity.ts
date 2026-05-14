import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('auth_sessions')
export class AuthSession {
    @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
    sessionId!: string;

    @Index()
    @Column({ name: 'user_id', type: 'int' })
    userId!: number;

    @Index({ unique: true })
    @Column({ name: 'refresh_token_jti', type: 'varchar', length: 36 })
    refreshTokenJti!: string;

    @Column({
        name: 'refresh_token_hash',
        type: 'varchar',
        length: 255,
        select: false,
    })
    refreshTokenHash!: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt!: Date;

    @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
    revokedAt!: Date | null;

    @Column({
        name: 'replaced_by_jti',
        type: 'varchar',
        length: 36,
        nullable: true,
    })
    replacedByJti!: string | null;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
    })
    createdAt!: Date;
}