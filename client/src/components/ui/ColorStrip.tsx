import type { HexColor } from '@chromesthesia/shared';
import { stripBackground } from '../../utils/color';

interface ColorStripProps {
    /** The song's colors, left to right */
    colors: HexColor[];
    /** Height, rounding and other classes, e.g. "h-3" */
    className?: string;
}

/**
 * A song's colors side by side in equal bands, like a paint chip strip. With no colors it is an
 * empty recessed well. Decorative: the colors are described elsewhere.
 */
const ColorStrip = ({ colors, className = '' }: ColorStripProps) => {
    const background = stripBackground(colors);
    return background ? (
        <span
            aria-hidden
            className={`block rounded-[3px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] ${className}`}
            style={{ background }}
        />
    ) : (
        <span aria-hidden className={`block well ${className}`} />
    );
};

export default ColorStrip;
