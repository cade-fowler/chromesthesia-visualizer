import type { HexColor } from '@chromesthesia/shared';
import { stripBackground } from '../../utils/color';

interface ColorStripProps {
    /** The song's colors, left to right */
    colors: HexColor[];
    /** Height, rounding and other classes, e.g. "h-3" */
    className?: string;
    /** A color to outline, such as the one that matched a search by color (its first band) */
    highlight?: HexColor;
}

const bevel = 'shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]';

/**
 * A song's colors side by side in equal bands, like a paint chip strip. With no colors it is an
 * empty recessed well. Decorative: the colors are described elsewhere.
 */
const ColorStrip = ({ colors, className = '', highlight }: ColorStripProps) => {
    const highlighted = highlight === undefined ? -1 : colors.indexOf(highlight);
    if (highlighted >= 0) {
        // Separate bands, so one can carry an outline
        return (
            <span aria-hidden className={`flex overflow-hidden rounded-[3px] ${className}`}>
                {colors.map((color, i) => (
                    <span
                        key={i}
                        className={`min-w-0 flex-1 ${i === highlighted ? 'z-10 rounded-[2px] shadow-[inset_0_0_0_2px_var(--color-ink),inset_0_0_0_3px_#fff]' : bevel}`}
                        style={{ background: color }}
                    />
                ))}
            </span>
        );
    }
    const background = stripBackground(colors);
    return background ? (
        <span
            aria-hidden
            className={`block rounded-[3px] ${bevel} ${className}`}
            style={{ background }}
        />
    ) : (
        <span aria-hidden className={`block well ${className}`} />
    );
};

export default ColorStrip;
