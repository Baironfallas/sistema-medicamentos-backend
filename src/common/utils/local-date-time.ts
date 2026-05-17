import { BadRequestException } from '@nestjs/common';

type LocalDateTimeParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

const INPUT_FORMATS = [
    'YYYY-MM-DDTHH:mm',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD HH:mm:ss',
    'DD/MM/YYYY HH:mm',
    'DD/MM/YYYY HH:mm:ss',
] as const;

const LOCAL_TIMEZONE = 'America/Costa_Rica';

// Pads numeric date-time parts to two digits for stable serialization.
function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// Extract date-time parts from a JS Date returned by mysql/typeorm for DATETIME columns.
// Those values must preserve the literal wall-clock time stored in the database.
function fromDate(value: Date): LocalDateTimeParts {
    if (Number.isNaN(value.getTime())) {
        throw new BadRequestException('Fecha invalida');
    }

    return {
        year: value.getUTCFullYear(),
        month: value.getUTCMonth() + 1,
        day: value.getUTCDate(),
        hour: value.getUTCHours(),
        minute: value.getUTCMinutes(),
        second: value.getUTCSeconds(),
    };
}

// Validates that the provided date-time parts produce a real calendar date and time.
function isValidParts(parts: LocalDateTimeParts): boolean {
    const candidate = new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
        0
    );

    return (
        candidate.getFullYear() === parts.year &&
        candidate.getMonth() === parts.month - 1 &&
        candidate.getDate() === parts.day &&
        candidate.getHours() === parts.hour &&
        candidate.getMinutes() === parts.minute &&
        candidate.getSeconds() === parts.second
    );
}

// Builds a native Date from validated local parts and rejects impossible inputs.
function buildDate(parts: LocalDateTimeParts): Date {
    const candidate = new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
        0
    );

    if (Number.isNaN(candidate.getTime()) || !isValidParts(parts)) {
        throw new BadRequestException('Fecha invalida');
    }

    return candidate;
}

// Parses ISO-like local date-time inputs such as 2026-03-27T14:30[:00].
function parseFromIso(value: string): LocalDateTimeParts | null {
    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: Number(match[6] ?? '0'),
    };
}

// Parses slash-based local date-time inputs such as 27/03/2026 14:30[:00].
function parseFromSlash(value: string): LocalDateTimeParts | null {
    const match = value.match(
        /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (!match) {
        return null;
    }

    return {
        year: Number(match[3]),
        month: Number(match[2]),
        day: Number(match[1]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: Number(match[6] ?? '0'),
    };
}

// Parses a supported string format and validates that it represents a real local date-time.
function parseString(value: string): LocalDateTimeParts {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new BadRequestException('La fecha no puede estar vacia');
    }

    const parsed = parseFromIso(trimmed) ?? parseFromSlash(trimmed);
    if (!parsed) {
        throw new BadRequestException(
            `Fecha invalida ("${trimmed}"). Formatos validos: ${INPUT_FORMATS.join(' o ')}`
        );
    }

    buildDate(parsed);
    return parsed;
}

// Converts a local date-time into a comparable Date without introducing server timezone drift.
export function parseLocalDateTime(value: string | Date): Date {
    const parts = value instanceof Date ? fromDate(value) : parseString(value);
    return new Date(Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
        0,
    ));
}

// Serializes parsed parts to the database/storage format used across the project.
function toStorageFormat(parts: LocalDateTimeParts): string {
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

// Serializes parsed parts to an ISO-like response format for the API.
function toResponseFormat(parts: LocalDateTimeParts): string {
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

// Normalizes any supported string input into the canonical storage date-time format.
export function normalizeLocalDateTime(value: unknown): string {
    if (typeof value !== 'string') {
        throw new BadRequestException('La fecha debe ser una cadena de texto');
    }

    return toStorageFormat(parseString(value));
}

// Formats stored values for API responses without losing their intended local meaning.
export function formatLocalDateTimeForResponse(value: string | Date | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const parts = value instanceof Date ? fromDate(value) : parseString(value);
    return toResponseFormat(parts);
}

// Formats a local date-time for human-readable UI display.
export function formatLocalDateTimeForDisplay(value: string | Date): string {
    const parts = value instanceof Date ? fromDate(value) : parseString(value);
    return `${pad(parts.day)}/${pad(parts.month)}/${parts.year} a las ${pad(parts.hour)}:${pad(parts.minute)}`;
}

function getCurrentPartsInTimeZone(timeZone: string): LocalDateTimeParts {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const read = (type: Intl.DateTimeFormatPartTypes): number => {
        const value = parts.find((part) => part.type === type)?.value;
        if (!value) {
            throw new BadRequestException('No se pudo obtener la fecha actual');
        }
        return Number(value);
    };

    return {
        year: read('year'),
        month: read('month'),
        day: read('day'),
        hour: read('hour') % 24,
        minute: read('minute'),
        second: read('second'),
    };
}

// Returns the current Costa Rica local date-time in storage format.
export function getCurrentLocalDateTime(): string {
    return toStorageFormat(getCurrentPartsInTimeZone(LOCAL_TIMEZONE));
}

// Compares two local date-time inputs after normalizing both to Date instances.
export function isLocalDateTimeBefore(left: string | Date, right: string | Date): boolean {
    return parseLocalDateTime(left).getTime() < parseLocalDateTime(right).getTime();
}

// Compares two local date-time inputs after normalizing both to Date instances.
export function isLocalDateTimeAfter(left: string | Date, right: string | Date): boolean {
    return parseLocalDateTime(left).getTime() > parseLocalDateTime(right).getTime();
}

export function subtractHoursFromLocalDateTime(
    value: string | Date,
    hours: number,
): string {
    const parsed = parseLocalDateTime(value);

    parsed.setUTCHours(parsed.getUTCHours() - hours);

    const parts: LocalDateTimeParts = {
        year: parsed.getUTCFullYear(),
        month: parsed.getUTCMonth() + 1,
        day: parsed.getUTCDate(),
        hour: parsed.getUTCHours(),
        minute: parsed.getUTCMinutes(),
        second: parsed.getUTCSeconds(),
    };

    return toStorageFormat(parts);
}