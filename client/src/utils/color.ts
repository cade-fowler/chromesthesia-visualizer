import type { HexColor } from '@chromesthesia/shared';

export const LIGHT_TEXT = '#f5f5f5';
export const DARK_TEXT = '#1c1c1c';

/** True when a "#rrggbb" color is dark enough that light text should go on top of it. */
export const isDark = (hex: HexColor): boolean => {
    const red = parseInt(hex.substring(1, 3), 16);
    const green = parseInt(hex.substring(3, 5), 16);
    const blue = parseInt(hex.substring(5, 7), 16);
    return (red + green + blue) / 3 <= 140;
};

/** Readable text color for content drawn on top of `hex`. */
export const textColorOn = (hex: HexColor) => (isDark(hex) ? LIGHT_TEXT : DARK_TEXT);
