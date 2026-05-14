import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ChatMessage } from 'src/chat-messages/entities/chat-message.entity';

@Entity('chat_sessions')
export class ChatSession {

    @PrimaryGeneratedColumn({ name: 'session_id' })
    sessionId!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @ManyToOne(() => User, (user) => user.chatSessions, {
        nullable: false,
        eager: false,
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT',
    })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title!: string | null;

    @CreateDateColumn({ name: 'started_at', type: 'timestamp' })
    startedAt!: Date;

    @UpdateDateColumn({ name: 'last_activity', type: 'timestamp' })
    lastActivity!: Date;

    @OneToMany(() => ChatMessage, (message) => message.session)
    messages!: ChatMessage[];
}