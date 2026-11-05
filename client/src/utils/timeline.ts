import type { ColorEntry } from '@chromesthesia/shared';
import { compareColorEntries } from './colorOrder';

/** A color for one part of a song (it has both times). */
export type PartEntry = ColorEntry & { startMs: number; endMs: number };

export const isPart = (entry: ColorEntry): entry is PartEntry =>
    entry.startMs !== undefined && entry.endMs !== undefined;

export interface TimelineLayout {
    /** Whole-song colors, in the order they were saved */
    wholeSong: ColorEntry[];
    /** Rows of parts that don't overlap within a row; overlapping parts go in later rows */
    lanes: PartEntry[][];
}

/**
 * Splits a song's colors into whole-song colors and rows of parts. Each part goes in the first
 * row that is free where it starts, so a section with several colors stacks them.
 */
export const layoutTimeline = (entries: ColorEntry[]): TimelineLayout => {
    const sorted = [...entries].sort(compareColorEntries);
    const wholeSong: ColorEntry[] = [];
    const lanes: PartEntry[][] = [];
    for (const entry of sorted) {
        if (!isPart(entry)) {
            wholeSong.push(entry);
            continue;
        }
        const lane = lanes.find((row) => row[row.length - 1].endMs <= entry.startMs);
        if (lane) lane.push(entry);
        else lanes.push([entry]);
    }
    return { wholeSong, lanes };
};

/** The parts playing at `ms` (a part covers its start but not its end). */
export const activeAt = (entries: ColorEntry[], ms: number): PartEntry[] =>
    entries.filter(isPart).filter((part) => part.startMs <= ms && ms < part.endMs);

/** How long the timeline is: the song's length, or failing that where the last part ends. */
export const timelineLength = (entries: ColorEntry[], durationMs?: number): number =>
    Math.max(durationMs ?? 0, ...entries.filter(isPart).map((part) => part.endMs));
