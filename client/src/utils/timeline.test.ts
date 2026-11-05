import { describe, expect, it } from 'vitest';
import type { ColorEntry } from '@chromesthesia/shared';
import { activeAt, layoutTimeline, timelineLength } from './timeline';

let saved = 0;
const entry = (id: string, range?: [number, number]): ColorEntry => ({
    id,
    songId: 'song',
    color: '#000000',
    createdAt: new Date(Date.UTC(2026, 10, 5, 0, 0, saved++)).toISOString(),
    ...(range && { startMs: range[0], endMs: range[1] }),
});

const ids = (rows: ColorEntry[][]) => rows.map((row) => row.map((e) => e.id));

describe('layoutTimeline', () => {
    it('separates whole-song colors from parts', () => {
        const layout = layoutTimeline([entry('part', [0, 1000]), entry('whole')]);
        expect(layout.wholeSong.map((e) => e.id)).toEqual(['whole']);
        expect(ids(layout.lanes)).toEqual([['part']]);
    });

    it('keeps parts that follow each other in one row', () => {
        const layout = layoutTimeline([entry('b', [1000, 2000]), entry('a', [0, 1000])]);
        expect(ids(layout.lanes)).toEqual([['a', 'b']]);
    });

    it('stacks overlapping parts and reuses rows once they are free', () => {
        const layout = layoutTimeline([
            entry('verse', [0, 4000]),
            entry('verse-2nd-color', [0, 4000]),
            entry('chorus', [4000, 8000]),
            entry('shimmer', [3000, 5000]),
            entry('tail', [5000, 6000]),
            entry('outro', [8000, 9000]),
        ]);
        expect(ids(layout.lanes)).toEqual([
            ['verse', 'chorus', 'outro'],
            ['verse-2nd-color', 'tail'],
            ['shimmer'],
        ]);
    });

    it('has no rows when there are no parts', () => {
        expect(layoutTimeline([entry('whole')]).lanes).toEqual([]);
    });
});

describe('activeAt', () => {
    const entries = [entry('whole'), entry('a', [0, 1000]), entry('b', [500, 2000])];

    it('finds every part covering the time', () => {
        expect(activeAt(entries, 750).map((e) => e.id)).toEqual(['a', 'b']);
    });

    it("includes a part's start but not its end", () => {
        expect(activeAt(entries, 1000).map((e) => e.id)).toEqual(['b']);
        expect(activeAt(entries, 2000)).toEqual([]);
    });
});

describe('timelineLength', () => {
    it("uses the song's length when known", () => {
        expect(timelineLength([entry('a', [0, 1000])], 200000)).toBe(200000);
    });

    it('falls back to where the last part ends', () => {
        expect(timelineLength([entry('a', [0, 1000]), entry('b', [500, 3000])])).toBe(3000);
    });

    it('stretches to a part saved past the known length', () => {
        expect(timelineLength([entry('a', [0, 5000])], 4000)).toBe(5000);
    });

    it('is 0 with no length and no parts', () => {
        expect(timelineLength([entry('whole')])).toBe(0);
    });
});
