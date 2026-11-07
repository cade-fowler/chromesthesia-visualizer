import { Link } from 'react-router';
import type { SongSummary } from '@chromesthesia/shared';
import { songPagePath } from '../../utils/paths';
import AlbumArt from './AlbumArt';
import ColorStrip from './ColorStrip';

interface SongCardProps {
    song: SongSummary;
    /** A short line under the strip, such as why the song is listed */
    note?: string;
}

/**
 * A song in a list: art, title, artists and a strip of its colors, opening its song page. In a
 * search by color, the color that matched is outlined in the strip.
 */
const SongCard = ({ song, note }: SongCardProps) => (
    <Link
        to={songPagePath(song.id)}
        className="flex items-center gap-4 panel p-3 outline-ink transition-[outline-width] hover:outline-2 focus-visible:outline-2"
    >
        <AlbumArt src={song.albumImageUrl} alt="" className="size-16 text-xl" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-bold tracking-[-0.01em]">{song.title}</span>
            <span className="truncate text-sm text-silk">{song.artists.join(', ')}</span>
            <ColorStrip
                colors={song.colors}
                highlight={song.match?.color}
                className={`mt-1.5 ${song.match ? 'h-3.5' : 'h-2.5'}`}
            />
            {song.match && <span className="sr-only">Matched {song.match.color}</span>}
            {note && <span className="mt-1 truncate text-[10px] silk">{note}</span>}
        </span>
    </Link>
);

export default SongCard;
