import type { CollectionProgress, ColorFamily, ColorShade, HexColor } from '@chromesthesia/shared';
import { FAMILY_SWATCHES } from './colorFamilies';
import { albumPagePath } from './paths';

// The Studio's Logbook: the daily goal, milestones and the prompts that suggest what to log next.

/** Song totals worth marking. Past the last one, every 500 songs is a milestone. */
export const MILESTONES = [10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000];

const LATE_STEP = 500;

/** The milestone already passed (0 before the first) and the next one to reach. */
export const milestone = (songs: number): { prev: number; next: number } => {
    const last = MILESTONES[MILESTONES.length - 1];
    if (songs >= last) {
        const prev = last + Math.floor((songs - last) / LATE_STEP) * LATE_STEP;
        return { prev, next: prev + LATE_STEP };
    }
    const next = MILESTONES.find((m) => m > songs)!;
    const prev = [...MILESTONES].reverse().find((m) => m <= songs) ?? 0;
    return { prev, next };
};

/** The milestone reached by going from `before` songs to `after`, if any. */
export const crossedMilestone = (before: number, after: number): number | undefined => {
    const { prev } = milestone(after);
    return after > before && prev > before ? prev : undefined;
};

// A local calendar day, so days end at the owner's midnight rather than UTC's
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export interface DayCounts {
    /** Songs first logged today */
    today: number;
    /** Songs today beyond the goal */
    overflow: number;
    /**
     * Days in a row at or over the goal, ending today when today's goal is met and yesterday
     * otherwise (today isn't over yet, so it doesn't break the streak)
     */
    streak: number;
}

/** Counts today's songs and the streak from each song's first color time. */
export const dayCounts = (loggedAt: string[], now: Date, goal: number): DayCounts => {
    const perDay = new Map<string, number>();
    for (const time of loggedAt) {
        const key = dayKey(new Date(time));
        perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
    const countOn = (daysAgo: number) =>
        perDay.get(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo))) ??
        0;

    const today = countOn(0);
    let streak = 0;
    for (let daysAgo = today >= goal ? 0 : 1; countOn(daysAgo) >= goal; daysAgo++) streak++;
    return { today, overflow: Math.max(0, today - goal), streak };
};

export type PromptKind = 'color' | 'decade' | 'album' | 'artist' | 'parts';

export const PROMPT_KINDS: { kind: PromptKind; label: string }[] = [
    { kind: 'color', label: 'Color' },
    { kind: 'decade', label: 'Decade' },
    { kind: 'album', label: 'Album' },
    { kind: 'artist', label: 'Artist' },
    { kind: 'parts', label: 'Parts' },
];

/** A suggestion of what to log next. */
export interface Prompt {
    /** Stays the same for the same suggestion, so it can be remembered and not repeated */
    key: string;
    kind: PromptKind;
    text: string;
    /** The gap it fills, e.g. "Blue · 3 songs · 0 navy" */
    detail: string;
    /** Where Go leads */
    to: string;
    /** How likely Shuffle is to pick it, relative to the others */
    weight: number;
    /** For color and decade prompts: songs in the bucket, so a new one can retire the prompt */
    count?: number;
    swatch?: HexColor;
    imageUrl?: string;
}

/** What each color prompt calls its color, and the swatch it shows. */
const COLOR_NAMES: Record<
    Exclude<ColorFamily, 'white' | 'black'>,
    Record<ColorShade, [name: string, swatch: HexColor]>
> = {
    red: { pale: ['pink', '#f4a3a0'], mid: ['red', '#e0352b'], deep: ['deep red', '#7a1712'] },
    orange: { pale: ['peach', '#f8c99a'], mid: ['orange', '#f08a24'], deep: ['brown', '#8a4a12'] },
    yellow: {
        pale: ['pale yellow', '#faeb9e'],
        mid: ['yellow', '#f2d02e'],
        deep: ['mustard', '#857014'],
    },
    green: {
        pale: ['mint', '#a8d8a8'],
        mid: ['green', '#3fa34d'],
        deep: ['forest green', '#1d5426'],
    },
    blue: { pale: ['sky blue', '#a9c6f0'], mid: ['blue', '#2f6fd6'], deep: ['navy', '#163a78'] },
    purple: {
        pale: ['lavender', '#cdb0e8'],
        mid: ['purple', '#8a4fc7'],
        deep: ['deep purple', '#432070'],
    },
};

/** Album, artist and parts prompts share this much weight per kind, so they mix in lightly. */
const LIST_KIND_WEIGHT = 0.3;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "the ’90s" for the last century, "the 2010s" for this one. */
export const decadeName = (decade: number) =>
    decade >= 2000 ? `the ${decade}s` : `the ’${String(decade).slice(2)}s`;

/** Every suggestion the progress allows, each with its weight. */
export const buildPrompts = (progress: CollectionProgress): Prompt[] => {
    const prompts: Prompt[] = [];
    const familySongs = new Map(progress.families.map((f) => [f.family, f.songs]));
    const familyLabel = new Map(FAMILY_SWATCHES.map((s) => [s.family, s]));

    for (const { family, shade, songs } of progress.colorBuckets) {
        const swatch = familyLabel.get(family)!;
        const [name, hex] =
            shade && family !== 'white' && family !== 'black'
                ? COLOR_NAMES[family][shade]
                : [swatch.label.toLowerCase(), swatch.hex];
        const total = familySongs.get(family) ?? 0;
        prompts.push({
            key: `color:${family}:${shade ?? ''}`,
            kind: 'color',
            text: `Find a song that’s ${name}`,
            detail: shade
                ? `${swatch.label} · ${plural(total, 'song')} · ${songs} ${name}`
                : `${swatch.label} · ${plural(total, 'song')}`,
            to: `/songs?family=${family}`,
            weight: 1 / (1 + songs),
            count: songs,
            swatch: hex,
        });
    }

    for (const { decade, songs } of progress.decades) {
        prompts.push({
            key: `decade:${decade}`,
            kind: 'decade',
            text:
                songs === 0
                    ? `No songs from ${decadeName(decade)} yet`
                    : `Lacking songs from ${decadeName(decade)}`,
            detail: `${decade}s · ${plural(songs, 'song')}`,
            to: `/songs?decade=${decade}`,
            weight: 1 / (1 + songs),
            count: songs,
        });
    }

    const { thinAlbums, oneSongArtists, oneColorSongs } = progress;
    for (const album of thinAlbums) {
        prompts.push({
            key: `album:${album.id}`,
            kind: 'album',
            text: `More from ${album.name}?`,
            detail: `${plural(album.songs, 'song')} logged`,
            to: albumPagePath(album.id),
            weight: LIST_KIND_WEIGHT / thinAlbums.length,
            imageUrl: album.imageUrl,
        });
    }
    for (const artist of oneSongArtists) {
        prompts.push({
            key: `artist:${artist}`,
            kind: 'artist',
            text: `Another ${artist} song?`,
            detail: '1 song logged',
            to: `/songs?q=${encodeURIComponent(artist)}`,
            weight: LIST_KIND_WEIGHT / oneSongArtists.length,
        });
    }
    for (const song of oneColorSongs) {
        prompts.push({
            key: `parts:${song.id}`,
            kind: 'parts',
            text: `Add parts to ${song.title}`,
            detail: `${song.artists.join(', ')} · ${plural(oneColorSongs.length, 'song')} with one color`,
            to: `/studio?song=${encodeURIComponent(song.id)}`,
            weight: LIST_KIND_WEIGHT / oneColorSongs.length,
        });
    }
    return prompts;
};

/**
 * Picks a prompt of one of the given kinds at random by weight, skipping the recent ones (unless
 * nothing else is left). Null when there's nothing of those kinds.
 */
export const pickPrompt = (
    prompts: Prompt[],
    kinds: ReadonlySet<PromptKind>,
    recent: readonly string[],
    rand: () => number = Math.random,
): Prompt | null => {
    const ofKind = prompts.filter((p) => kinds.has(p.kind));
    const fresh = ofKind.filter((p) => !recent.includes(p.key));
    const pool = fresh.length > 0 ? fresh : ofKind;
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let roll = rand() * total;
    for (const prompt of pool) {
        roll -= prompt.weight;
        if (roll < 0) return prompt;
    }
    return pool[pool.length - 1] ?? null;
};

/**
 * The prompt as it is in a fresh list, or null once it's done: its album, artist or song isn't a
 * gap anymore, or its color or decade got another song.
 */
export const refreshPrompt = (prompt: Prompt, prompts: Prompt[]): Prompt | null => {
    const now = prompts.find((p) => p.key === prompt.key);
    if (!now) return null;
    if (prompt.count !== undefined && now.count !== undefined && now.count > prompt.count) {
        return null;
    }
    return now;
};

/** How many recent prompts Shuffle avoids repeating. */
export const RECENT_PROMPTS = 3;
