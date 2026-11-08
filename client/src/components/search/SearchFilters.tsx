import FindByColor, { type ColorSearchMode } from './FindByColor';
import FindSong from './FindSong';
import type { useSongSearch } from './useSongSearch';
import { hasColorSearch } from '../../utils/songSearch';

interface SearchFiltersProps {
    /** The page's search, from useSongSearch() */
    songSearch: ReturnType<typeof useSongSearch>;
    /** Decades with songs in them, oldest first */
    decades: number[];
    /** The color search modes on offer (all of them by default) */
    modes?: ColorSearchMode[];
}

/**
 * The two search panels, by song and by color, wired to the page's search. They're siblings, so
 * the page lays them out (side by side on Explore, stacked in the Songs page's side column).
 */
const SearchFilters = ({ songSearch, decades, modes }: SearchFiltersProps) => {
    const { search, text, setText, update, found, current } = songSearch;
    return (
        <>
            <FindSong
                text={text}
                onText={setText}
                decade={search.decade}
                onDecade={(d) => update({ decade: d })}
                decades={decades}
            />
            <FindByColor
                modes={modes}
                color={search.color}
                family={search.family}
                onColor={(c, replace) => update({ color: c }, replace)}
                onFamily={(f, replace) => update({ family: f }, replace)}
                hue={search.hue}
                light={search.light}
                onRange={(range, replace) =>
                    update({ hue: range.hue, light: range.light }, replace)
                }
                onClear={() =>
                    update({
                        color: undefined,
                        family: undefined,
                        hue: undefined,
                        light: undefined,
                    })
                }
                count={hasColorSearch(search) && current && found ? found.songs.length : undefined}
            />
        </>
    );
};

export default SearchFilters;
