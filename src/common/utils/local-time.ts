import { BadRequestException } from '@nestjs/common';

type LocalTimeParts = {
    hour: number;
    minute: number;
    second: number;
};

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function isValidParts(parts: LocalTimeParts): boolean {
    return (
        parts.hour >= 0 && parts.hour <= 23 &&
        parts.minute >= 0 && parts.minute <= 59 &&
        parts.second >= 0 && parts.second <= 59
    );
}

function parse24Hour(value: string): LocalTimeParts | null {
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;

    return {
        hour: Number(match[1]),
        minute: Number(match[2]),
        second: Number(match[3] ?? '0'),
    };
}

function parse12Hour(value: string): LocalTimeParts | null {
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) return null;

    let hour = Number(match[1]);
    const meridiem = match[4].toUpperCase();

    if (meridiem === 'AM' && hour === 12) hour = 0;
    if (meridiem === 'PM' && hour !== 12) hour += 12;

    return {
        hour,
        minute: Number(match[2]),
        second: Number(match[3] ?? '0'),
    };
}

function parseString(value: string): LocalTimeParts {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new BadRequestException('La hora no puede estar vacía');
    }

    const parsed = parse12Hour(trimmed) ?? parse24Hour(trimmed);

    if (!parsed || !isValidParts(parsed)) {
        throw new BadRequestException(
            `Hora inválida ("${trimmed}"). Formatos válidos: HH:mm, HH:mm:ss, h:mm AM/PM`
        );
    }

    return parsed;
}

function toStorageFormat(parts: LocalTimeParts): string {
    return `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

function toResponseFormat(parts: LocalTimeParts): string {
    return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function normalizeLocalTime(value: unknown): string {
    if (typeof value !== 'string') {
        throw new BadRequestException('La hora debe ser una cadena de texto');
    }

    return toStorageFormat(parseString(value));
}

export function formatLocalTimeForResponse(value: string | null | undefined): string | null {
    if (!value) return null;

    const parsed = parse24Hour(value.trim());
    if (!parsed) return value;

    return toResponseFormat(parsed);
}