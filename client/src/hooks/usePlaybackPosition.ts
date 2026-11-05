import { useEffect, useState } from 'react';
import type { NowPlaying } from '@chromesthesia/shared';

const TICK_MS = 250;

/**
 * The current playback position in ms, or null when nothing is playing. Spotify is only polled
 * every few seconds, so between polls this counts forward from the last reported position.
 *
 * @param polledAt When `song` was fetched (Date.now() in the poll that returned it)
 */
const usePlaybackPosition = (song: NowPlaying | null, polledAt: number): number | null => {
    const [now, setNow] = useState(() => Date.now());

    const isPlaying = song?.isPlaying ?? false;
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(interval);
    }, [isPlaying]);

    if (!song) return null;
    if (!song.isPlaying) return song.progressMs;
    // `now` can trail polledAt until the next tick; never count backwards
    const elapsed = Math.max(0, now - polledAt);
    return Math.min(song.progressMs + elapsed, song.durationMs);
};

export default usePlaybackPosition;
