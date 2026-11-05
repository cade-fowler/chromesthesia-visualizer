import { describe, expect, it } from 'vitest';
import type { ColorEntry } from '@chromesthesia/shared';
import {
    colorEntryChanges,
    emptyFields,
    fieldsFromEntry,
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
        [{ end: '1:15' }, 'Give both'],
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
