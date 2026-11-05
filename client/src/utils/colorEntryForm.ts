import type {
    AddColorRequest,
    ColorEntry,
    HexColor,
    UpdateColorRequest,
} from '@chromesthesia/shared';
import { formatMs, parseTime } from './time';

/** What the color entry form holds while you type. */
export interface ColorEntryFields {
    label: string;
    start: string;
    end: string;
    /** Comma-separated */
    notes: string;
}

export const emptyFields: ColorEntryFields = { label: '', start: '', end: '', notes: '' };

export const fieldsFromEntry = (entry: ColorEntry): ColorEntryFields => ({
    label: entry.label ?? '',
    start: entry.startMs === undefined ? '' : formatMs(entry.startMs),
    end: entry.endMs === undefined ? '' : formatMs(entry.endMs),
    notes: entry.notes?.join(', ') ?? '',
});

/** Splits "glossy, warm" into distinct, trimmed notes. */
export const parseNotes = (text: string): string[] => [
    ...new Set(
        text
            .split(',')
            .map((note) => note.trim())
            .filter(Boolean),
    ),
];

export type FormResult = { ok: true; request: AddColorRequest } | { ok: false; error: string };

/**
 * Fills in the missing side of an open-ended part: a start alone runs to the end of the song
 * (when its length is known), and an end alone runs from the beginning.
 */
export const fillOpenEnds = (
    startMs: number | undefined,
    endMs: number | undefined,
    durationMs?: number,
): { startMs: number | undefined; endMs: number | undefined } => {
    if (startMs !== undefined && endMs === undefined) return { startMs, endMs: durationMs };
    if (startMs === undefined && endMs !== undefined) return { startMs: 0, endMs };
    return { startMs, endMs };
};

/**
 * Turns the form into a request, with the same rules for times as the server.
 *
 * @param durationMs The song's length, which a start given without an end runs to
 */
export const readFields = (
    color: HexColor,
    fields: ColorEntryFields,
    durationMs?: number,
): FormResult => {
    const startText = fields.start.trim();
    const endText = fields.end.trim();
    const parsedStart = startText ? parseTime(startText) : undefined;
    const parsedEnd = endText ? parseTime(endText) : undefined;

    if (parsedStart === null) return { ok: false, error: 'Start should be a time like 1:15' };
    if (parsedEnd === null) return { ok: false, error: 'End should be a time like 1:15' };
    // To require both times again, use parsedStart/parsedEnd here instead
    const { startMs, endMs } = fillOpenEnds(parsedStart, parsedEnd, durationMs);
    if ((startMs === undefined) !== (endMs === undefined)) {
        return { ok: false, error: 'Give both a start and an end, or neither for the whole song' };
    }
    if (startMs !== undefined && endMs! <= startMs) {
        return { ok: false, error: 'End must be after start' };
    }

    const label = fields.label.trim();
    if (label.length > 50) return { ok: false, error: 'Keep the label to 50 characters' };
    const notes = parseNotes(fields.notes);

    return {
        ok: true,
        request: {
            color,
            ...(startMs !== undefined && { startMs, endMs }),
            ...(label && { label }),
            ...(notes.length > 0 && { notes }),
        },
    };
};

const sameNotes = (a: string[] = [], b: string[] = []) =>
    a.length === b.length && a.every((note, i) => note === b[i]);

/** The PATCH body that turns `entry` into `request`: changed fields only, null to clear. */
export const colorEntryChanges = (
    entry: ColorEntry,
    request: AddColorRequest,
): UpdateColorRequest => {
    const changes: UpdateColorRequest = {};
    if (request.color !== entry.color) changes.color = request.color;
    if (request.startMs !== entry.startMs || request.endMs !== entry.endMs) {
        changes.startMs = request.startMs ?? null;
        changes.endMs = request.endMs ?? null;
    }
    if (request.label !== entry.label) changes.label = request.label ?? null;
    if (!sameNotes(request.notes, entry.notes)) changes.notes = request.notes ?? null;
    return changes;
};
