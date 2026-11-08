import { describe, expect, it } from 'vitest';
import type { CollectionProgress } from '@chromesthesia/shared';
import {
    buildPrompts,
    crossedMilestone,
    dayCounts,
    decadeName,
    milestone,
    pickPrompt,
    refreshPrompt,
    type Prompt,
    type PromptKind,
} from './logbook';

describe('milestone', () => {
    it.each([
        [0, 0, 10],
        [9, 0, 10],
        [10, 10, 25],
        [99, 75, 100],
        [100, 100, 150],
        [999, 750, 1000],
        [1000, 1000, 1500],
        [1700, 1500, 2000],
    ])('%i songs: passed %i, next %i', (songs, prev, next) => {
        expect(milestone(songs)).toEqual({ prev, next });
    });
});

describe('crossedMilestone', () => {
    it('names the milestone a save reached', () => {
        expect(crossedMilestone(99, 100)).toBe(100);
        expect(crossedMilestone(24, 26)).toBe(25);
    });

    it('is undefined when no milestone was reached, or the count went down', () => {
        expect(crossedMilestone(100, 101)).toBeUndefined();
        expect(crossedMilestone(101, 100)).toBeUndefined();
    });
});

describe('dayCounts', () => {
    // Local times, so the tests hold in any time zone
    const at = (day: number, hour = 12) => new Date(2026, 10, day, hour).toISOString();
    const now = new Date(2026, 10, 8, 20);
    const times = (day: number, n: number) => Array.from({ length: n }, () => at(day));

    it('counts today and what’s past the goal', () => {
        expect(dayCounts([...times(8, 13), at(7)], now, 10)).toEqual({
            today: 13,
            overflow: 3,
            streak: 1,
        });
    });

    it('splits days at local midnight', () => {
        const counts = dayCounts([at(7, 23), at(8, 0)], now, 1);

        expect(counts.today).toBe(1);
        expect(counts.streak).toBe(2);
    });

    it('keeps the streak going while today is still short of the goal', () => {
        const loggedAt = [...times(8, 2), ...times(7, 3), ...times(6, 3)];

        expect(dayCounts(loggedAt, now, 3)).toEqual({ today: 2, overflow: 0, streak: 2 });
    });

    it('stops the streak at a day short of the goal', () => {
        const loggedAt = [...times(8, 3), ...times(7, 3), ...times(6, 1), ...times(5, 3)];

        expect(dayCounts(loggedAt, now, 3).streak).toBe(2);
    });

    it('is all zero with nothing logged', () => {
        expect(dayCounts([], now, 10)).toEqual({ today: 0, overflow: 0, streak: 0 });
    });
});

describe('decadeName', () => {
    it('shortens the last century and spells out this one', () => {
        expect(decadeName(1990)).toBe('the ’90s');
        expect(decadeName(2010)).toBe('the 2010s');
    });
});

const progress: CollectionProgress = {
    songs: 3,
    colors: 4,
    loggedAt: [],
    colorBuckets: [
        { family: 'blue', shade: 'deep', songs: 0 },
        { family: 'blue', shade: 'mid', songs: 3 },
        { family: 'white', shade: null, songs: 1 },
    ],
    families: [
        { family: 'blue', songs: 3, colors: [] },
        { family: 'white', songs: 1, colors: [] },
    ],
    decades: [
        { decade: 1990, songs: 2 },
        { decade: 1970, songs: 0 },
    ],
    thinAlbums: [{ id: 'al', name: 'Blue Album', imageUrl: 'https://i.scdn.co/x', songs: 1 }],
    oneSongArtists: ['Someone', 'Else'],
    oneColorSongs: [{ id: 's1', title: 'Song', artists: ['A', 'B'] }],
};

describe('buildPrompts', () => {
    const prompts = buildPrompts(progress);
    const byKey = (key: string) => prompts.find((p) => p.key === key)!;

    it('suggests every color bucket, emptiest weighted most', () => {
        expect(byKey('color:blue:deep')).toMatchObject({
            kind: 'color',
            text: 'Find a song that’s navy',
            detail: 'Blue · 3 songs · 0 navy',
            to: '/songs?family=blue',
            weight: 1,
            count: 0,
            swatch: '#163a78',
        });
        expect(byKey('color:blue:mid').weight).toBe(0.25);
        expect(byKey('color:white:')).toMatchObject({
            text: 'Find a song that’s white',
            detail: 'White · 1 song',
            swatch: '#f7f7f4',
        });
    });

    it('suggests thin decades', () => {
        expect(byKey('decade:1990')).toMatchObject({
            text: 'Lacking songs from the ’90s',
            detail: '1990s · 2 songs',
            to: '/songs?decade=1990',
        });
        expect(byKey('decade:1970').text).toBe('No songs from the ’70s yet');
    });

    it('suggests albums, artists and parts, sharing a lower weight per kind', () => {
        expect(byKey('album:al')).toMatchObject({
            text: 'More from Blue Album?',
            detail: '1 song logged',
            to: '/albums/al',
            imageUrl: 'https://i.scdn.co/x',
            weight: 0.3,
        });
        expect(byKey('artist:Someone')).toMatchObject({
            text: 'Another Someone song?',
            to: '/songs?q=Someone',
            weight: 0.15,
        });
        expect(byKey('parts:s1')).toMatchObject({
            text: 'Add parts to Song',
            detail: 'A, B · 1 song with one color',
            to: '/studio?song=s1',
        });
    });
});

describe('pickPrompt', () => {
    const prompt = (key: string, kind: PromptKind, weight: number): Prompt => ({
        key,
        kind,
        text: key,
        detail: '',
        to: '/',
        weight,
    });
    const prompts = [prompt('a', 'color', 1), prompt('b', 'color', 3), prompt('c', 'decade', 1)];
    const all = new Set<PromptKind>(['color', 'decade']);

    it('picks by weight', () => {
        expect(pickPrompt(prompts, all, [], () => 0)?.key).toBe('a');
        expect(pickPrompt(prompts, all, [], () => 0.25)?.key).toBe('b');
        expect(pickPrompt(prompts, all, [], () => 0.99)?.key).toBe('c');
    });

    it('only picks the chosen kinds', () => {
        expect(pickPrompt(prompts, new Set(['decade']), [], () => 0)?.key).toBe('c');
        expect(pickPrompt(prompts, new Set(['album']), [])).toBeNull();
    });

    it('skips recent prompts unless nothing else is left', () => {
        for (const roll of [0, 0.5, 0.99]) {
            expect(pickPrompt(prompts, all, ['a', 'b'], () => roll)?.key).toBe('c');
        }
        expect(pickPrompt(prompts, new Set(['decade']), ['c'], () => 0)?.key).toBe('c');
    });
});

describe('refreshPrompt', () => {
    const prompts = buildPrompts(progress);
    const navy = prompts.find((p) => p.key === 'color:blue:deep')!;

    it('keeps a prompt that’s still a gap', () => {
        expect(refreshPrompt(navy, prompts)).toEqual(navy);
    });

    it('retires a color prompt once its bucket gets a song', () => {
        const later = buildPrompts({
            ...progress,
            colorBuckets: [{ family: 'blue', shade: 'deep', songs: 1 }],
        });

        expect(refreshPrompt(navy, later)).toBeNull();
    });

    it('retires an album prompt once the album isn’t thin', () => {
        const album = prompts.find((p) => p.key === 'album:al')!;

        expect(refreshPrompt(album, buildPrompts({ ...progress, thinAlbums: [] }))).toBeNull();
    });
});
