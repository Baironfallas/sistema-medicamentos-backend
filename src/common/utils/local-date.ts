import { BadRequestException } from '@nestjs/common';

type LocalDateParts = {
    year: number;
    month: number;
    day: number;
};

// Pads numeric date parts to two digits for stable serialization.
function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// Validates that the provided date parts represent a real calendar date.
// Noon is used to avoid edge cases introduced by timezone shifts near midnight.
function isValidParts(parts: LocalDateParts): boolean {
    const candidate = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);

    return (
        candidate.getFullYear() === parts.year &&
        candidate.getMonth() === parts.month - 1 &&
        candidate.getDate() === parts.day
    );
}

// Parses ISO date inputs such as 2026-03-27.
function parseIso(value: string): LocalDateParts | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
    };
}

// Parses slash-based date inputs such as 27/03/2026.
function parseSlash(value: string): LocalDateParts | null {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        return null;
    }

    return {
        year: Number(match[3]),
        month: Number(match[2]),
        day: Number(match[1]),
    };
}

// Parses a supported string format and rejects impossible calendar dates.
function parseString(value: string): LocalDateParts {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new BadRequestException('La fecha no puede estar vacia');
    }

    const parsed = parseIso(trimmed) ?? parseSlash(trimmed);
    if (!parsed || !isValidParts(parsed)) {
        throw new BadRequestException(
            `Fecha invalida ("${trimmed}"). Formatos validos: YYYY-MM-DD o DD/MM/YYYY`
        );
    }

    return parsed;
}

// Extracts plain local date parts from a native Date after validating it.
function fromDate(value: Date): LocalDateParts {
    if (Number.isNaN(value.getTime())) {
        throw new BadRequestException('Fecha invalida');
    }

    return {
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate(),
    };
}

// Serializes parsed parts to the canonical YYYY-MM-DD format.
function toIso(parts: LocalDateParts): string {
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

// Normalizes any supported string input into the canonical date format.
export function normalizeLocalDate(value: unknown): string {
    if (typeof value !== 'string') {
        throw new BadRequestException('La fecha debe ser una cadena de texto');
    }

    return toIso(parseString(value));
}

// Formats date values for API responses using the canonical date-only representation.
export function formatLocalDateForResponse(value: string | Date | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const parts = value instanceof Date ? fromDate(value) : parseString(value);
    return toIso(parts);
}
