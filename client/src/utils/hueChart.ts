import type { HueChartColor } from '@chromesthesia/shared';

/** How many hue columns the chart has; each covers HUE_STEP degrees of OKLCH hue. */
export const HUE_COLUMNS = 24;
const HUE_STEP = 360 / HUE_COLUMNS;

/**
 * The hue the first column starts at. It's where the server's red band starts (HUE_BANDS in
 * server/src/color.ts), so pinks and reds sit together at the left and purples end the axis.
 */
const START_HUE = 345;

/** Which column (0 to HUE_COLUMNS - 1) a hue goes in. */
export const hueColumn = (hue: number): number =>
    Math.floor(((((hue - START_HUE) % 360) + 360) % 360) / HUE_STEP) % HUE_COLUMNS;

/**
 * The family names printed under the axis, at the column each band starts in. The hues are
 * HUE_BANDS' starts in server/src/color.ts, so the labels agree with the color swatches.
 */
export const HUE_LABELS: { label: string; column: number }[] = [
    { label: 'Red', hue: 345 },
    { label: 'Orange', hue: 42 },
    { label: 'Yellow', hue: 75 },
    { label: 'Green', hue: 120 },
    { label: 'Blue', hue: 180 },
    { label: 'Purple', hue: 285 },
].map(({ label, hue }) => ({ label, column: hueColumn(hue) }));

const darkestFirst = (a: HueChartColor, b: HueChartColor) =>
    a.lightness - b.lightness || a.id.localeCompare(b.id);

export interface HueChartLayout {
    /** HUE_COLUMNS columns, left to right, each darkest first (the bottom of the stack) */
    columns: HueChartColor[][];
    /** Greyish colors, which have no real hue, darkest first */
    greys: HueChartColor[];
    /** How many colors the tallest column has */
    tallest: number;
}

/** Sorts colors into the chart's hue columns and the grey column, each stacked darkest first. */
export const layoutHueChart = (colors: HueChartColor[]): HueChartLayout => {
    const columns: HueChartColor[][] = Array.from({ length: HUE_COLUMNS }, () => []);
    const greys: HueChartColor[] = [];
    for (const color of colors) {
        if (color.hue === null) greys.push(color);
        else columns[hueColumn(color.hue)].push(color);
    }
    for (const column of columns) column.sort(darkestFirst);
    greys.sort(darkestFirst);
    const tallest = Math.max(greys.length, ...columns.map((column) => column.length));
    return { columns, greys, tallest };
};
