/** Formats a time in a song as m:ss, e.g. 75000 -> "1:15". Rounds down to the second. */
export const formatMs = (ms: number): string => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const seconds = totalSeconds % 60;
    return `${Math.floor(totalSeconds / 60)}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Parses "m:ss", "m:ss.s" or plain seconds ("75", "7.5") into ms. Returns null for anything
 * else, including seconds past 59 after a colon. Whitespace around the input is ignored.
 */
export const parseTime = (input: string): number | null => {
    const match = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(input.trim());
    if (!match) return null;
    const [, minutes, seconds] = match;
    if (minutes !== undefined && (Number(seconds) >= 60 || seconds.split('.')[0].length !== 2)) {
        return null;
    }
    return Math.round((Number(minutes ?? 0) * 60 + Number(seconds)) * 1000);
};
