import { HttpException, Injectable, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { ChatMessage } from 'src/chat-messages/entities/chat-message.entity';
import { ChatMessageResponseDto } from 'src/chat-messages/dto/chat-message-response.dto';
import { MessageSender } from 'src/common/enums/message-sender.enum';
import { GeminiService } from 'src/gemini/gemini.service';
import { GeminiMessageInput } from 'src/gemini/types/gemini.types';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { ChatSessionDetailResponseDto } from './dto/chat-session-detail-response.dto';
import { ChatSessionResponseDto } from './dto/chat-session-response.dto';
import { ChatSession } from './entities/chat-session.entity';
import { ChatContextsService } from 'src/chat-contexts/chat-contexts.service';

@Injectable()
export class ChatSessionsService {
  constructor(
    @InjectPinoLogger(ChatSessionsService.name)
    private readonly logger: PinoLogger,

    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,

    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,

    private readonly chatContextsService: ChatContextsService,

    private readonly geminiService: GeminiService,
  ) { }

  async create(dto: CreateChatSessionDto, userId: number,): Promise<ChatSessionDetailResponseDto> {
    try {
      this.logger.info({ userId }, 'Creando nueva sesión de chat');

      const session = await this.chatSessionRepository.save({
        userId,
        title: this.generateSessionTitle(dto.content),
      });

      const userMessage = await this.chatMessageRepository.save({
        sessionId: session.sessionId,
        sender: MessageSender.USER,
        content: dto.content,
      });

      const activeMedicationsSummary =
        await this.chatContextsService.buildActiveMedicationsSummary(userId);

      const geminiMessages: GeminiMessageInput[] = [
        this.toGeminiMessageInput(userMessage),
      ];

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

      const updatedSession = await this.findSessionOrFail(
        session.sessionId,
        userId,
      );

      return {
        session: this.toSessionResponseDto(updatedSession),
        messages: [
          this.toMessageResponseDto(userMessage),
          this.toMessageResponseDto(assistantMessage),
        ],
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        {
          err: this.formatUnknownError(error),
          userId,
        },
        'Error al crear sesión de chat',
      );

      throw new InternalServerErrorException(
        'Ocurrió un error al crear la sesión de chat.',
      );
    }
  }

  async findAllByUser(userId: number): Promise<ChatSessionResponseDto[]> {
    try {
      const sessions = await this.chatSessionRepository.find({
        where: { userId },
        order: {
          lastActivity: 'DESC',
        },
      });

      return sessions.map((session) => this.toSessionResponseDto(session));
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        {
          err: this.formatUnknownError(error),
          userId,
        },
        'Error al obtener sesiones de chat',
      );

      throw new InternalServerErrorException(
        'Ocurrió un error al obtener las sesiones de chat.',
      );
    }
  }

  async findOneByUser(sessionId: number, userId: number,): Promise<ChatSessionDetailResponseDto> {
    try {
      const session = await this.findSessionOrFail(sessionId, userId);

      const messages = await this.chatMessageRepository.find({
        where: { sessionId },
        order: {
          sentAt: 'ASC',
        },
      });

      return {
        session: this.toSessionResponseDto(session),
        messages: messages.map((message) =>
          this.toMessageResponseDto(message),
        ),
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        {
          err: this.formatUnknownError(error),
          sessionId,
          userId,
        },
        'Error al obtener sesión de chat',
      );

      throw new InternalServerErrorException(
        'Ocurrió un error al obtener la sesión de chat.',
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

  private async updateLastActivity(sessionId: number, userId: number,): Promise<void> {
    await this.chatSessionRepository.update(
      { sessionId, userId },
      { lastActivity: () => 'CURRENT_TIMESTAMP' },
    );
  }

  private generateSessionTitle(content: string): string {
    const normalizedContent = content.trim().replace(/\s+/g, ' ');

    if (normalizedContent.length <= 60) {
      return normalizedContent;
    }

    return `${normalizedContent.slice(0, 57).trim()}...`;
  }


  private toGeminiMessageInput(message: ChatMessage): GeminiMessageInput {
    return {
      sender: message.sender,
      content: message.content,
      sentAt: message.sentAt,
    };
  }

  private toSessionResponseDto(session: ChatSession): ChatSessionResponseDto {
    return {
      sessionId: session.sessionId,
      title: session.title,
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
    };
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