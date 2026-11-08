import { Link, Navigate } from 'react-router';
import SectionLabel from '../ui/SectionLabel';
import SongCard from '../ui/SongCard';
import { smallKeyClass } from '../ui/buttons';
import SearchFilters from '../search/SearchFilters';
import { useSongSearch } from '../search/useSongSearch';
import { albumMatches } from '../../utils/albumMatches';
import { hasColorSearch } from '../../utils/songSearch';
import AlbumResult from './AlbumResult';

/**
 * The home page's basic search: text, decade and color swatches, with the results underneath.
 * Results show only once something is searched for; all the filters that are set apply
 * together. The Songs page has the same search with more ways to search by color.
 */
const SongSearch = ({ decades }: { decades: number[] }) => {
    const songSearch = useSongSearch({ limit: 200 });
    const { search, params, enabled, found, error } = songSearch;

    // Links to an exact color or range search, made before those moved to the Songs page
    if (search.color || search.hue || search.light) {
        return <Navigate to={{ pathname: '/songs', search: params }} replace />;
    }

    const results = found?.songs ?? null;
    const albums = found ? albumMatches(found.songs, found.q) : [];

    return (
        <section className="flex flex-col gap-4">
            <div className="grid gap-6 lg:grid-cols-2">
                <SearchFilters songSearch={songSearch} decades={decades} modes={['swatches']} />
            </div>
            {!enabled ? null : error ? (
                <p className="text-sm font-bold text-danger" role="alert">
                    {error}
                </p>
            ) : !results ? (
                <p className="text-sm text-silk">Loading…</p>
            ) : (
                <>
                    <SectionLabel
                        aside={
                            <span className="flex items-center gap-3">
                                {results.length}
                                <Link to={`/songs?${params}`} className={smallKeyClass}>
                                    More filters
                                </Link>
                            </span>
                        }
                    >
                        {hasColorSearch(search) ? 'Closest matches' : 'Results'}
                    </SectionLabel>
                    {results.length === 0 ? (
                        <p className="text-sm text-silk">No songs match.</p>
                    ) : (
                        <>
                            {albums.length > 0 && (
                                <ul
                                    aria-label="Albums"
                                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                                >
                                    {albums.map((match) => (
                                        <li key={match.album.id} className="min-w-0">
                                            <AlbumResult match={match} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <ul
                                aria-label="Songs"
                                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {results.map((song) => (
                                    <li key={song.id} className="min-w-0">
                                        <SongCard song={song} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </>
            )}
        </section>
    );
};

export default SongSearch;
