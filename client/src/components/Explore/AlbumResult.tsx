import { Link } from 'react-router';
import type { AlbumMatch } from '../../utils/albumMatches';
import { albumPagePath } from '../../utils/paths';
import AlbumArt from '../ui/AlbumArt';
import ColorStrip from '../ui/ColorStrip';

const TYPE_LABELS = { album: 'Album', single: 'Single', compilation: 'Compilation' } as const;

/**
 * An album in search results. It's a recessed display rather than a raised song card, with a
 * printed label and an arrow, so it reads as a different kind of result.
 */
const AlbumResult = ({ match }: { match: AlbumMatch }) => {
    const { album, albumImageUrl, artists, songCount, colors } = match;
    return (
        <Link
            to={albumPagePath(album.id)}
            className="group flex items-center gap-4 well rounded-md p-3 outline-ink transition-[outline-width] hover:outline-2 focus-visible:outline-2"
        >
            <AlbumArt src={albumImageUrl} alt="" className="size-20 text-xl" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-mono text-[10px] tracking-[0.08em] text-silk uppercase">
                    {`${TYPE_LABELS[album.type]} · ${album.releaseDate.slice(0, 4)} · ${songCount} ${songCount === 1 ? 'song' : 'songs'}`}
                </span>
                <span className="truncate text-lg leading-tight font-bold tracking-[-0.02em]">
                    {album.name}
                </span>
                <span className="truncate text-sm text-silk">{artists.join(', ')}</span>
                <ColorStrip colors={colors} className="mt-1.5 h-2.5" />
            </span>
            <span
                aria-hidden
                className="hidden shrink-0 text-[11px] font-bold tracking-[0.08em] text-silk uppercase group-hover:text-ink sm:block"
            >
                Album →
            </span>
        </Link>
    );
};

export default AlbumResult;
