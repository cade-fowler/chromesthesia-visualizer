import type { ColorEntry, Song } from '@chromesthesia/shared';
import PlayingAnimation from './PlayingAnimation';
import AlbumArt from '../../ui/AlbumArt';
import { textColorOn } from '../../../utils/color';
import { formatMs } from '../../../utils/time';

interface SpotifyNowPlayingProps {
    /** The song being worked on: the one playing, or a saved song picked in the Studio */
    song: Pick<Song, 'title' | 'artists' | 'albumImageUrl' | 'songUrl'> | null;
    /** The label above the title, e.g. "Now playing" or "Saved song" */
    status: string;
    /** Animates the playing indicator */
    isPlaying: boolean;
    /** Shown in place of the song when there isn't one */
    emptyMessage?: string;
    /** The colors sounding right now: whole-song colors and the parts under the playhead */
    activeColors: ColorEntry[];
}

const describe = (entry: ColorEntry) =>
    entry.startMs === undefined
        ? `${entry.label ?? 'Whole song'} · ${entry.color}`
        : `${entry.label ?? 'Part'} · ${formatMs(entry.startMs)}–${formatMs(entry.endMs!)} · ${entry.color}`;

/** The song display: album art, song, and a bar of every color active right now. */
const SpotifyNowPlaying = ({
    song,
    status,
    isPlaying,
    emptyMessage = 'Play a song on Spotify to start adding colors.',
    activeColors,
}: SpotifyNowPlayingProps) => {
    return (
        <div className="flex items-center gap-4 well rounded-md p-4 sm:gap-5">
            <AlbumArt
                src={song?.albumImageUrl}
                alt={song ? `${song.title} album art` : ''}
                className="size-18 sm:size-22"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-silk uppercase">
                    <PlayingAnimation isPlaying={isPlaying} />
                    {status}
                </span>
                {song ? (
                    <>
                        <a
                            className="line-clamp-2 text-xl leading-tight font-bold tracking-[-0.02em] hover:underline sm:text-2xl"
                            href={song.songUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {song.title}
                        </a>
                        <span className="truncate text-sm text-silk">
                            {song.artists.join(', ')}
                        </span>
                    </>
                ) : (
                    emptyMessage && <span className="text-sm text-silk">{emptyMessage}</span>
                )}
                {activeColors.length > 0 && (
                    <div
                        className="mt-2 flex gap-[3px]"
                        role="group"
                        aria-label="Colors playing now"
                    >
                        {activeColors.map((entry) => (
                            <span
                                key={entry.id}
                                title={describe(entry)}
                                className="h-6 min-w-0 flex-1 truncate rounded-[3px] px-2 text-[10px] leading-6 font-bold tracking-[0.06em] uppercase shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]"
                                style={{
                                    backgroundColor: entry.color,
                                    color: textColorOn(entry.color),
                                }}
                            >
                                {entry.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpotifyNowPlaying;
