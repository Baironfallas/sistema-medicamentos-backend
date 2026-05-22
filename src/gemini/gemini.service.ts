import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PinoLogger } from 'nestjs-pino';
import { MessageSender } from 'src/common/enums/message-sender.enum';
import { GEMINI_HISTORY_LIMIT, GEMINI_MAX_OUTPUT_TOKENS, GEMINI_MAX_RESPONSE_LENGTH, GEMINI_RESPONSE_DISCLAIMER, SUPPORTED_GEMINI_MODELS, buildMedicationAssistantSystemInstruction, } from './gemini.constants';
import { GeminiRole } from 'src/common/enums/gemini-role.enum';
import { GeminiContent, GeminiMessageInput } from './types/gemini.types';

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GeminiService.name);

    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');

    const model = this.configService.getOrThrow<string>('GEMINI_MODEL');

    if (!this.isSupportedGeminiModel(model)) {
      throw new InternalServerErrorException(
        `El modelo de Gemini configurado no es válido: ${model}`,
      );
    }

    this.model = model;
    this.ai = new GoogleGenAI({
      apiKey,
    });
  }

  async generateMedicationAssistantResponse(messages: GeminiMessageInput[], activeMedicationsSummary: string): Promise<string> {
    try {
      const systemInstruction =
        buildMedicationAssistantSystemInstruction(
          activeMedicationsSummary,
        );

      const contents = this.buildGeminiContents(messages);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        },
      });

      const responseText = response.text?.trim();

      if (!responseText) {
        return this.getFallbackResponse();
      }

      return this.normalizeResponse(responseText);
    } catch (error: unknown) {
      this.logger.error(
        {
          error: this.formatUnknownError(error),
        },
        'Error al generar respuesta con Gemini.',
      );

      throw new InternalServerErrorException(
        'No se pudo generar la respuesta del asistente en este momento.',
      );
    }
  }

  private buildGeminiContents(messages: GeminiMessageInput[]): GeminiContent[] {
    return messages
      .filter((message) => message.content.trim().length > 0)
      .sort(
        (firstMessage, secondMessage) =>
          firstMessage.sentAt.localeCompare(secondMessage.sentAt),
      )
      .slice(-GEMINI_HISTORY_LIMIT)
      .map((message) => ({
        role: this.mapSenderToGeminiRole(message.sender),
        parts: [
          {
            text: message.content.trim(),
          },
        ],
      }));
  }

  private mapSenderToGeminiRole(sender: MessageSender): GeminiRole {
    return sender === MessageSender.USER
      ? GeminiRole.USER
      : GeminiRole.MODEL;
  }

  private normalizeResponse(text: string): string {
    let normalized = text.trim();

    if (!normalized.includes(GEMINI_RESPONSE_DISCLAIMER)) {
      normalized = `${normalized}\n\n${GEMINI_RESPONSE_DISCLAIMER}`;
    }

    if (normalized.length > GEMINI_MAX_RESPONSE_LENGTH) {
      const availableLength =
        GEMINI_MAX_RESPONSE_LENGTH -
        GEMINI_RESPONSE_DISCLAIMER.length -
        2;

      const trimmedResponse = normalized
        .replace(GEMINI_RESPONSE_DISCLAIMER, '')
        .trim()
        .slice(0, availableLength)
        .trim();

      normalized = `${trimmedResponse}\n\n${GEMINI_RESPONSE_DISCLAIMER}`;
    }

    return normalized;
  }

  private getFallbackResponse(): string {
    return `No pude generar una respuesta clara en este momento. Puedes intentar reformular tu pregunta con más detalle.

${GEMINI_RESPONSE_DISCLAIMER}`;
  }

  private formatUnknownError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Error desconocido al comunicarse con Gemini.';
  }

  private isSupportedGeminiModel(model: string): boolean {
    return SUPPORTED_GEMINI_MODELS.includes(
      model as (typeof SUPPORTED_GEMINI_MODELS)[number],
    );
  }
}