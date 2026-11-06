import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AlbumArtProps {
    src?: string;
    alt: string;
    /** Size and other classes, e.g. "size-18" */
    className?: string;
}

/** A song's album art, or a Spotify icon tile when there isn't any. */
const AlbumArt = ({ src, alt, className = '' }: AlbumArtProps) =>
    src ? (
        <img className={`shrink-0 rounded-[2px] object-cover ${className}`} alt={alt} src={src} />
    ) : (
        <div
            className={`grid shrink-0 place-items-center rounded-[2px] bg-ink/10 text-2xl text-silk ${className}`}
        >
            <FontAwesomeIcon icon={faSpotify} />
        </div>
    );

export default AlbumArt;
