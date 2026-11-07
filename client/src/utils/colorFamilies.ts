import type { ColorFamily, HexColor } from '@chromesthesia/shared';

/** One of the home page's color swatches, which searches a whole family of colors. */
export interface FamilySwatch {
    family: ColorFamily;
    label: string;
    /** The swatch's color; the server ranks a family's songs by closeness to it */
    hex: HexColor;
}

/**
 * The swatches, in rainbow order then white and black. The hexes match FAMILY_COLORS in
 * server/src/color.ts, which also decides which colors belong to each family.
 */
export const FAMILY_SWATCHES: FamilySwatch[] = [
    { family: 'red', label: 'Red', hex: '#e0352b' },
    { family: 'orange', label: 'Orange', hex: '#f08a24' },
    { family: 'yellow', label: 'Yellow', hex: '#f2d02e' },
    { family: 'green', label: 'Green', hex: '#3fa34d' },
    { family: 'blue', label: 'Blue', hex: '#2f6fd6' },
    { family: 'purple', label: 'Purple', hex: '#8a4fc7' },
    { family: 'white', label: 'White', hex: '#f7f7f4' },
    { family: 'black', label: 'Black', hex: '#1c1c1d' },
];

const FAMILIES = new Set<string>(FAMILY_SWATCHES.map((s) => s.family));

export const isColorFamily = (value: string): value is ColorFamily => FAMILIES.has(value);
