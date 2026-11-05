import { describe, expect, it } from 'vitest';
import type { ColorEntry } from '@chromesthesia/shared';
import { compareColorEntries, insertInSongOrder, replaceInSongOrder } from './colorOrder';

const entry = (
    id: string,
    createdAt: string,
    range?: [startMs: number, endMs: number],
): ColorEntry => ({
    id,
    songId: 'song',
    color: '#000000',
    createdAt: `2026-11-05T00:00:${createdAt}.000Z`,
    ...(range && { startMs: range[0], endMs: range[1] }),
});

describe('compareColorEntries', () => {
    it('puts whole-song colors first, then parts by start, ties by save time', () => {
        const entries = [
            entry('late-part', '01', [5000, 9000]),
            entry('whole-2', '05'),
            entry('mid-saved-later', '04', [1000, 2000]),
            entry('mid-saved-first', '02', [1000, 3000]),
            entry('start', '06', [0, 500]),
            entry('whole-1', '03'),
        ];

        expect(entries.sort(compareColorEntries).map((e) => e.id)).toEqual([
            'whole-1',
            'whole-2',
            'start',
            'mid-saved-first',
            'mid-saved-later',
            'late-part',
        ]);
    });

    it('falls back to the id when saved in the same millisecond', () => {
        const [a, b] = [entry('a', '01'), entry('b', '01')];
        expect([b, a].sort(compareColorEntries)).toEqual([a, b]);
    });
});

describe('insertInSongOrder', () => {
    it('puts a new whole-song color before existing parts', () => {
        const existing = [entry('whole', '01'), entry('part', '02', [0, 1000])];

        const result = insertInSongOrder(existing, entry('new', '03'));

        expect(result.map((e) => e.id)).toEqual(['whole', 'new', 'part']);
        expect(existing).toHaveLength(2); // doesn't mutate the original
    });
});

describe('replaceInSongOrder', () => {
    it('swaps in the updated entry and moves it to its new place', () => {
        const existing = [
            entry('whole', '01'),
            entry('a', '02', [0, 1000]),
            entry('b', '03', [2000, 3000]),
        ];

        const result = replaceInSongOrder(existing, entry('a', '02', [4000, 5000]));

        expect(result.map((e) => e.id)).toEqual(['whole', 'b', 'a']);
        expect(result[2].startMs).toBe(4000);
        expect(existing[1].startMs).toBe(0); // doesn't mutate the original
    });
});
