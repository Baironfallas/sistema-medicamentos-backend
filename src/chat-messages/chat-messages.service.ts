import { HttpException, Injectable, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ChatContextsService } from 'src/chat-contexts/chat-contexts.service';
import { ChatSession } from 'src/chat-sessions/entities/chat-session.entity';
import { MessageSender } from 'src/common/enums/message-sender.enum';
import { GeminiService } from 'src/gemini/gemini.service';
import { GeminiMessageInput } from 'src/gemini/types/gemini.types';
import { Repository } from 'typeorm';
import { ChatMessageExchangeResponseDto } from './dto/chat-message-exchange-response.dto';
import { ChatMessageResponseDto } from './dto/chat-message-response.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectPinoLogger(ChatMessagesService.name)
    private readonly logger: PinoLogger,

    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,

    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,

    private readonly geminiService: GeminiService,

    private readonly chatContextsService: ChatContextsService,
  ) { }

  async create(sessionId: number, dto: CreateChatMessageDto, userId: number,): Promise<ChatMessageExchangeResponseDto> {
    try {
      const session = await this.findSessionOrFail(sessionId, userId);
      const userMessage = await this.chatMessageRepository.save({
        sessionId: session.sessionId,
        sender: MessageSender.USER,
        content: dto.content,
      });

      const history = await this.findSessionMessages(session.sessionId);

      const geminiMessages = this.toGeminiMessageInputs(history);

      const activeMedicationsSummary =
        await this.chatContextsService.buildActiveMedicationsSummary(userId);

      const assistantResponse =
        await this.geminiService.generateMedicationAssistantResponse(
          geminiMessages,
          activeMedicationsSummary,
        );

      const assistantMessage = await this.chatMessageRepository.save({
        sessionId: session.sessionId,
        sender: MessageSender.ASSISTANT,
        content: assistantResponse,
      });

      await this.updateLastActivity(session.sessionId, userId);

      return {
        userMessage: this.toMessageResponseDto(userMessage),
        assistantMessage: this.toMessageResponseDto(assistantMessage),
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        {
          error: this.formatUnknownError(error),
          sessionId,
          userId,
        },
        'Error al crear mensaje en sesión de chat.',
      );

      throw new InternalServerErrorException(
        'Ocurrió un error al enviar el mensaje.',
      );
    }
  }

  async findMessagesBySession(sessionId: number, userId: number,): Promise<ChatMessageResponseDto[]> {
    try {
      const session = await this.findSessionOrFail(sessionId, userId);

      const messages = await this.findSessionMessages(session.sessionId);

      return messages.map((message) => this.toMessageResponseDto(message));
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        {
          error: this.formatUnknownError(error),
          sessionId,
          userId,
        },
        'Error al obtener mensajes de la sesión de chat.',
      );

      throw new InternalServerErrorException(
        'Ocurrió un error al obtener los mensajes de la sesión.',
      );
    }
  }

  private async findSessionOrFail(sessionId: number, userId: number,): Promise<ChatSession> {
    const session = await this.chatSessionRepository.findOne({
      where: {
        sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Sesión de chat no encontrada.');
    }

    return session;
  }

  private async findSessionMessages(sessionId: number,): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: {
        sessionId,
      },
      order: {
        sentAt: 'ASC',
      },
    });
  }

  private toGeminiMessageInputs(messages: ChatMessage[],): GeminiMessageInput[] {
    return messages.map((message) => ({
      sender: message.sender,
      content: message.content,
      sentAt: message.sentAt,
    }));
  }

  private async updateLastActivity(sessionId: number, userId: number,): Promise<void> {
    await this.chatSessionRepository.update(
      { sessionId, userId },
      { lastActivity: () => 'CURRENT_TIMESTAMP' },
    );
  }

  private toMessageResponseDto(message: ChatMessage,): ChatMessageResponseDto {
    return {
      messageId: message.messageId,
      sender: message.sender,
      content: message.content,
      sentAt: message.sentAt,
    };
  }

  private formatUnknownError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Error desconocido.';
  }
}