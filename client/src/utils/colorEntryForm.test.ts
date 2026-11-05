import { describe, expect, it } from 'vitest';
import type { ColorEntry } from '@chromesthesia/shared';
import {
    colorEntryChanges,
    emptyFields,
    fieldsFromEntry,
    fillOpenEnds,
    parseNotes,
    readFields,
} from './colorEntryForm';

const part: ColorEntry = {
    id: 'a',
    songId: 'song',
    color: '#ff0000',
    startMs: 15000,
    endMs: 75000,
    label: 'chorus',
    notes: ['glossy', 'warm'],
    createdAt: '2026-11-05T00:00:00.000Z',
};

describe('parseNotes', () => {
    it('splits on commas, trims, and drops blanks and repeats', () => {
        expect(parseNotes(' glossy, warm,, glossy ,')).toEqual(['glossy', 'warm']);
    });
});

describe('readFields', () => {
    it('reads an empty form as a whole-song color', () => {
        expect(readFields('#00ff00', emptyFields)).toEqual({
            ok: true,
            request: { color: '#00ff00' },
        });
    });

    it('reads a part with its label and notes', () => {
        const fields = { label: ' chorus ', start: '0:15', end: '1:15', notes: 'glossy, warm' };
        expect(readFields('#ff0000', fields)).toEqual({
            ok: true,
            request: {
                color: '#ff0000',
                startMs: 15000,
                endMs: 75000,
                label: 'chorus',
                notes: ['glossy', 'warm'],
            },
        });
    });

    it.each([
        [{ start: '1:15' }, 'Give both'],
        [{ start: 'soon', end: '1:15' }, 'Start should be'],
        [{ start: '0:10', end: 'later' }, 'End should be'],
        [{ start: '1:15', end: '1:15' }, 'End must be after start'],
        [{ label: 'x'.repeat(51) }, '50 characters'],
    ])('rejects %j', (fields, error) => {
        const result = readFields('#ff0000', { ...emptyFields, ...fields });
        expect(result.ok).toBe(false);
        expect(!result.ok && result.error).toContain(error);
    });
});

describe('open-ended parts', () => {
    it('runs a start without an end to the end of the song', () => {
        const result = readFields('#ff0000', { ...emptyFields, start: '3:00' }, 215000);
        expect(result).toEqual({
            ok: true,
            request: { color: '#ff0000', startMs: 180000, endMs: 215000 },
        });
    });

    it('runs an end without a start from the beginning', () => {
        const result = readFields('#ff0000', { ...emptyFields, end: '0:30' }, 215000);
        expect(result).toEqual({
            ok: true,
            request: { color: '#ff0000', startMs: 0, endMs: 30000 },
        });
    });

    it('still needs an end when the song length is unknown', () => {
        expect(readFields('#ff0000', { ...emptyFields, start: '3:00' }).ok).toBe(false);
    });

    it('rejects a start at or past the end of the song', () => {
        expect(readFields('#ff0000', { ...emptyFields, start: '4:00' }, 215000).ok).toBe(false);
    });

    it('leaves complete and empty ranges alone', () => {
        expect(fillOpenEnds(1, 2, 10)).toEqual({ startMs: 1, endMs: 2 });
        expect(fillOpenEnds(undefined, undefined, 10)).toEqual({
            startMs: undefined,
            endMs: undefined,
        });
    });
});

describe('fieldsFromEntry', () => {
    it('round-trips an entry through readFields', () => {
        const result = readFields(part.color, fieldsFromEntry(part));
        expect(result.ok && colorEntryChanges(part, result.request)).toEqual({});
    });
});

describe('colorEntryChanges', () => {
    it('lists only what changed', () => {
        expect(
            colorEntryChanges(part, {
                color: '#0000ff',
                startMs: 15000,
                endMs: 80000,
                label: 'chorus',
                notes: ['glossy', 'warm'],
            }),
        ).toEqual({ color: '#0000ff', startMs: 15000, endMs: 80000 });
    });

    it('clears removed fields with null', () => {
        expect(colorEntryChanges(part, { color: '#ff0000' })).toEqual({
            startMs: null,
            endMs: null,
            label: null,
            notes: null,
        });
    });

    it('sets fields a whole-song entry did not have', () => {
        const whole: ColorEntry = {
            id: 'b',
            songId: 'song',
            color: '#ff0000',
            createdAt: part.createdAt,
        };
        expect(
            colorEntryChanges(whole, { color: '#ff0000', startMs: 0, endMs: 1000, label: 'intro' }),
        ).toEqual({
            startMs: 0,
            endMs: 1000,
            label: 'intro',
        });
    });
});
