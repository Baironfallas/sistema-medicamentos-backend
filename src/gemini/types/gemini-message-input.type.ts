import { MessageSender } from 'src/common/enums/message-sender.enum';

export interface GeminiMessageInput {
    sender: MessageSender;
    content: string;
    sentAt: string;
}