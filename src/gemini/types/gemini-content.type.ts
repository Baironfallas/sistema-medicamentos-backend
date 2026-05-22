import { GeminiRole } from 'src/common/enums/gemini-role.enum';

export interface GeminiPart {
    text: string;
}

export interface GeminiContent {
    role: GeminiRole;
    parts: GeminiPart[];
}