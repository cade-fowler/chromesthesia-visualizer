import SectionLabel from '../ui/SectionLabel';
import { inputClass } from '../ui/fields';
import { toggleKeyClass } from '../ui/buttons';

/** "90s" for 1990, "00s" for 2000 */
const decadeLabel = (decade: number) => `${String(decade).slice(2)}s`;

interface FindSongProps {
    /** What's typed in the search box */
    text: string;
    onText: (text: string) => void;
    decade?: number;
    onDecade: (decade: number | undefined) => void;
    /** Decades with songs in them, oldest first, offered as filters */
    decades: number[];
}

/** The text search over titles, artists and album names, with decade filters. */
const FindSong = ({ text, onText, decade, onDecade, decades }: FindSongProps) => (
    <div className="flex flex-col gap-4 panel screws p-6">
        <SectionLabel>Find a song</SectionLabel>
        <input
            type="search"
            className={`${inputClass} h-11 text-base`}
            placeholder="Song, artist or album"
            aria-label="Search songs by title, artist or album"
            value={text}
            onChange={(e) => onText(e.target.value)}
        />
        {decades.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Decade">
                {decades.map((d) => (
                    <button
                        key={d}
                        type="button"
                        className={toggleKeyClass(decade === d)}
                        aria-pressed={decade === d}
                        onClick={() => onDecade(decade === d ? undefined : d)}
                    >
                        {decadeLabel(d)}
                    </button>
                ))}
            </div>
        )}
    </div>
);

export default FindSong;
