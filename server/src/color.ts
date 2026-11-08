import type {
    ColorFamily,
    ColorShade,
    HexColor,
    HueRange,
    LightRange,
} from '@chromesthesia/shared';

/**
 * Color math for search by color. Colors are compared in OKLab, a perceptual color space:
 * straight-line distance there roughly matches how different two colors look. OKLCH is the same
 * space in polar form: L (lightness, 0–1), C (chroma, how colorful; about 0–0.37 for sRGB) and
 * h (hue angle in degrees).
 */

export interface OkLab {
    L: number;
    a: number;
    b: number;
}

export interface OkLch {
    L: number;
    C: number;
    /** Hue in degrees, 0 to 360 (meaningless when C is near 0) */
    h: number;
}

const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Converts a lowercase "#rrggbb" color to OKLab (Björn Ottosson's matrices). */
export const hexToOkLab = (hex: HexColor): OkLab => {
    const r = toLinear(parseInt(hex.slice(1, 3), 16));
    const g = toLinear(parseInt(hex.slice(3, 5), 16));
    const b = toLinear(parseInt(hex.slice(5, 7), 16));

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    return {
        L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
};

export const hexToOkLch = (hex: HexColor): OkLch => {
    const { L, a, b } = hexToOkLab(hex);
    const h = (Math.atan2(b, a) * 180) / Math.PI;
    return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
};

/**
 * How much more a difference in chroma counts than plain OKLab says. Chroma only reaches about
 * 0.1 for dark colors, so without this a dark grey sits as close to a dark brown or green as to
 * another grey.
 */
export const CHROMA_WEIGHT = 2.5;

/**
 * How different two colors look: 0 for the same color, about 1 from black to white. It's OKLab
 * distance with the difference split into lightness, chroma and hue (as CIE94 does), and the
 * chroma part weighted by CHROMA_WEIGHT, so a grey and a muted color are told apart while
 * neighboring hues still match.
 */
export const colorDistance = (x: HexColor, y: HexColor): number => {
    const p = hexToOkLab(x);
    const q = hexToOkLab(y);
    const chroma = Math.hypot(p.a, p.b) - Math.hypot(q.a, q.b);
    // What's left of the a/b difference once the chroma difference is taken out is the hue part
    const hueSquared = Math.max(0, (p.a - q.a) ** 2 + (p.b - q.b) ** 2 - chroma ** 2);
    return Math.sqrt((p.L - q.L) ** 2 + (CHROMA_WEIGHT * chroma) ** 2 + hueSquared);
};

/** Colors within this distance of the searched color count as close (Hex and HSL search). */
export const CLOSE_DISTANCE = 0.12;

/** Songs within this songDistance() of a song are listed as similar to it. */
export const SIMILAR_DISTANCE = 0.2;

/** The mean distance from each of `from`'s colors to its closest color in `to`. */
const meanClosest = (from: HexColor[], to: HexColor[]) =>
    from.reduce((sum, x) => sum + Math.min(...to.map((y) => colorDistance(x, y))), 0) / from.length;

/**
 * How different two songs' colors look, for Similar songs. Each color is matched to its closest
 * color in the other song, both ways, and the two averages are averaged: 0 for the same palette,
 * and the same score whichever song comes first. Every entry counts, so a color logged for
 * several parts weighs more. `close` counts how many of `a`'s colors have a match in `b` within
 * CLOSE_DISTANCE. Both songs need at least one color.
 */
export const songDistance = (
    a: HexColor[],
    b: HexColor[],
): { distance: number; close: number } => ({
    distance: (meanClosest(a, b) + meanClosest(b, a)) / 2,
    close: a.filter((x) => b.some((y) => colorDistance(x, y) <= CLOSE_DISTANCE)).length,
});

/**
 * Below this chroma a color is greyish, so it counts as white or black instead of a hue.
 * Pastels such as #f2c4ce (about 0.05) still count as their hue; creams such as #efeae0 don't.
 */
export const GREY_CHROMA = 0.035;

/** Lighter than this, a greyish color is white; otherwise it's black. */
const WHITE_LIGHTNESS = 0.6;

/** Darker than this, any color is black: its hue is too dark to see. */
const BLACK_LIGHTNESS = 0.2;

interface HueFamily {
    family: Exclude<ColorFamily, 'white' | 'black'>;
    /** OKLCH hue where the band starts, inclusive; it runs to the next family's start */
    from: number;
}

/**
 * Hue bands, in order around the wheel. Each runs from its `from` to the next one's; purple's
 * runs past 360 back to red's. For reference, OKLCH hues of the sRGB primaries: red 29°,
 * orange (#ff8000) 55°, yellow 110°, green 142°, cyan 195°, blue 264°, magenta 328°.
 * Pinks (about 350°–10°) land in red.
 */
const HUE_BANDS: HueFamily[] = [
    { family: 'red', from: 345 },
    { family: 'orange', from: 42 },
    { family: 'yellow', from: 75 },
    { family: 'green', from: 120 },
    { family: 'blue', from: 180 },
    { family: 'purple', from: 285 },
];

/**
 * The color each family's results are ranked against: a song whose matching color is closest
 * to it comes first. The client's swatches (client/src/utils/colorFamilies.ts) use the same hexes.
 */
export const FAMILY_COLORS: Record<ColorFamily, HexColor> = {
    red: '#e0352b',
    orange: '#f08a24',
    yellow: '#f2d02e',
    green: '#3fa34d',
    blue: '#2f6fd6',
    purple: '#8a4fc7',
    white: '#f7f7f4',
    black: '#1c1c1d',
};

/** The named family a color belongs to, as the home page's swatches group colors. */
export const familyOf = (hex: HexColor): ColorFamily => {
    const { L, C, h } = hexToOkLch(hex);
    if (L < BLACK_LIGHTNESS) return 'black';
    if (C < GREY_CHROMA) return L >= WHITE_LIGHTNESS ? 'white' : 'black';
    // The band whose start is the last one at or below h; below orange's start that's red
    let family = HUE_BANDS[0].family;
    for (const band of HUE_BANDS.slice(1)) {
        if (h >= band.from) family = band.family;
    }
    return h >= HUE_BANDS[0].from ? HUE_BANDS[0].family : family;
};

/**
 * How light a color is within its family, for the Studio's color prompts: pale, mid or deep,
 * judged against the family's swatch color, since a mid yellow is far lighter than a mid blue.
 * Pale starts 40% of the way from the swatch's lightness to white; deep starts 40% of the way
 * down to BLACK_LIGHTNESS. White and black have no shade (null).
 */
export const shadeOf = (hex: HexColor): ColorShade | null => {
    const family = familyOf(hex);
    if (family === 'white' || family === 'black') return null;
    const { L } = hexToOkLch(hex);
    const swatch = hexToOkLch(FAMILY_COLORS[family]).L;
    if (L >= swatch + 0.4 * (1 - swatch)) return 'pale';
    if (L <= swatch - 0.4 * (swatch - BLACK_LIGHTNESS)) return 'deep';
    return 'mid';
};

/** A range search: a hue range, a lightness range, or both. */
export interface ColorRange {
    hue?: HueRange;
    light?: LightRange;
}

/** How far hue `h` is past `from`, going up round the wheel: 0 to just under 360. */
const degreesPast = (h: number, from: number) => (((h - from) % 360) + 360) % 360;

/** How many degrees a hue range spans; one that wraps past 360 is measured the short way round. */
const hueSpan = ({ from, to }: HueRange) => degreesPast(to, from);

/** Whether hue `h` (any degrees) is in the range, which wraps past 360 when `from > to`. */
export const inHueRange = (h: number, range: HueRange): boolean =>
    // Ranges are whole degrees, so a hue up to (not including) the next degree still counts
    degreesPast(h, range.from) < hueSpan(range) + 1;

/**
 * Whether a color is in the range. With a hue range, greyish colors (chroma under GREY_CHROMA)
 * never are: their hue is meaningless. Lightness is OKLCH L in percent.
 */
export const inColorRange = (hex: HexColor, { hue, light }: ColorRange): boolean => {
    const { L, C, h } = hexToOkLch(hex);
    // A little leeway, so white (L ≈ 1, give or take rounding) is in 0–100
    if (light && (L * 100 < light.from - 1e-6 || L * 100 > light.to + 1e-6)) return false;
    if (hue && (C < GREY_CHROMA || !inHueRange(h, hue))) return false;
    return true;
};

/**
 * How far a color in the range is from the range's middle: 0 at the middle, about 1 at an edge.
 * The hue and lightness parts are each measured against half the range's width, then combined
 * (and scaled back to 0–1 when both are given).
 */
export const rangeCenterDistance = (hex: HexColor, { hue, light }: ColorRange): number => {
    const { L, h } = hexToOkLch(hex);
    const parts: number[] = [];
    if (hue) {
        const half = (hueSpan(hue) + 1) / 2;
        parts.push(Math.abs(degreesPast(h, hue.from) - half) / half);
    }
    if (light) {
        const half = Math.max((light.to - light.from) / 2, 0.5);
        parts.push(Math.abs(L * 100 - (light.from + light.to) / 2) / half);
    }
    if (parts.length === 0) return 0;
    return Math.min(1, Math.hypot(...parts) / Math.sqrt(parts.length));
};
