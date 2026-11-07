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

/**
 * A CSS background that splits its width into equal bands, one per color, left to right.
 * Returns undefined for no colors.
 */
export const stripBackground = (colors: HexColor[]): string | undefined => {
    if (colors.length === 0) return undefined;
    if (colors.length === 1) return colors[0];
    const band = 100 / colors.length;
    const stops = colors.map((color, i) => `${color} ${i * band}% ${(i + 1) * band}%`);
    return `linear-gradient(to right, ${stops.join(', ')})`;
};

/** A color as hue (0–360), saturation and lightness (both 0–100), as CSS hsl() takes them. */
export interface Hsl {
    h: number;
    s: number;
    l: number;
}

/**
 * Reads a typed color: "#rgb" or "#rrggbb", with or without the "#", in any case. Returns it as
 * lowercase "#rrggbb", or null when it isn't a color.
 */
export const parseHex = (text: string): HexColor | null => {
    const digits = text.trim().replace(/^#/, '').toLowerCase();
    if (/^[0-9a-f]{6}$/.test(digits)) return `#${digits}`;
    if (/^[0-9a-f]{3}$/.test(digits)) return `#${[...digits].map((d) => d + d).join('')}`;
    return null;
};

/** Converts "#rrggbb" to HSL, rounded to whole numbers. Greys get hue 0. */
export const hexToHsl = (hex: HexColor): Hsl => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h: number;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
};

/** Converts HSL (hue 0–360, saturation and lightness 0–100) to lowercase "#rrggbb". */
export const hslToHex = ({ h, s, l }: Hsl): HexColor => {
    const sat = s / 100;
    const light = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = sat * Math.min(light, 1 - light);
    const channel = (n: number) => {
        const value = light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
        return Math.round(value * 255)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`;
};
