import type { ColorEntry } from '@chromesthesia/shared';

/**
 * Song order, matching the API's: whole-song colors first, then parts by where they start,
 * with ties going to whichever was saved first. Keep in step with colorsFor() on the server.
 */
export const compareColorEntries = (a: ColorEntry, b: ColorEntry): number =>
    (a.startMs ?? -1) - (b.startMs ?? -1) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id);

/** Adds an entry to a list already in song order, keeping it in song order. */
export const insertInSongOrder = (entries: ColorEntry[], entry: ColorEntry): ColorEntry[] =>
    [...entries, entry].sort(compareColorEntries);

/** Swaps in an updated entry (matched by id), keeping the list in song order. */
export const replaceInSongOrder = (entries: ColorEntry[], entry: ColorEntry): ColorEntry[] =>
    entries.map((e) => (e.id === entry.id ? entry : e)).sort(compareColorEntries);
