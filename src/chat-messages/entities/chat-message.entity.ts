import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { ChatSession } from 'src/chat-sessions/entities/chat-session.entity';
import { MessageSender } from '../../common/enums/message-sender.enum';

@Entity('chat_messages')
export class ChatMessage {

    @PrimaryGeneratedColumn({ name: 'message_id' })
    messageId!: number;

    @Column({ name: 'session_id' })
    sessionId!: number;

    @ManyToOne(() => ChatSession, (session) => session.messages, {
        nullable: false,
        eager: false,
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
    })
    @JoinColumn({ name: 'session_id' })
    session!: ChatSession;

    @Column({
        type: 'enum',
        enum: MessageSender,
    })
    sender!: MessageSender;

    @Column({ type: 'varchar', length: 2000 })
    content!: string;

    @CreateDateColumn({ name: 'sent_at', type: 'timestamp' })
    sentAt!: string;
}