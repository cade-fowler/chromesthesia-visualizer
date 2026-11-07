import type { HexColor } from '@chromesthesia/shared';
import SectionLabel from '../ui/SectionLabel';

/** Every distinct color on the album's songs, as a row of pads in track order. */
const AlbumPalette = ({ colors }: { colors: HexColor[] }) => {
    const distinct = [...new Set(colors)];
    return (
        <section className="flex flex-col gap-4 panel screws p-6">
            <SectionLabel aside={distinct.length}>Palette</SectionLabel>
            {distinct.length > 0 ? (
                <ul className="flex flex-wrap gap-2.5">
                    {distinct.map((color) => (
                        <li key={color}>
                            <span
                                className="block size-10 pad"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                            <span className="sr-only">{color}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-silk">No colors yet.</p>
            )}
        </section>
    );
};

export default AlbumPalette;
