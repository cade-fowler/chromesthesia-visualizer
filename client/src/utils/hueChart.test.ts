import { describe, expect, it } from 'vitest';
import type { HueChartColor } from '@chromesthesia/shared';
import { HUE_COLUMNS, HUE_LABELS, hueColumn, layoutHueChart } from './hueChart';

const entry = (id: string, hue: number | null, lightness: number): HueChartColor => ({
    id,
    color: '#000000',
    songId: `song-${id}`,
    title: id,
    artists: ['Someone'],
    hue,
    lightness,
});

describe('hueColumn', () => {
    it('starts the axis at 345° and wraps around 360°', () => {
        expect(hueColumn(345)).toBe(0);
        expect(hueColumn(359.9)).toBe(0);
        expect(hueColumn(0)).toBe(1);
        expect(hueColumn(29)).toBe(2);
        expect(hueColumn(344.9)).toBe(HUE_COLUMNS - 1);
        expect(hueColumn(360)).toBe(1);
    });

    it('puts the family labels in order along the axis', () => {
        const columns = HUE_LABELS.map((l) => l.column);
        expect(columns[0]).toBe(0);
        expect([...columns].sort((a, b) => a - b)).toEqual(columns);
    });
});

describe('layoutHueChart', () => {
    it('stacks each column darkest first and keeps greys in their own column', () => {
        const { columns, greys, tallest } = layoutHueChart([
            entry('light-red', 29, 0.8),
            entry('dark-red', 25, 0.3),
            entry('blue', 264, 0.45),
            entry('white', null, 0.97),
            entry('black', null, 0.1),
            entry('mid-red', 20, 0.5),
        ]);

        expect(columns).toHaveLength(HUE_COLUMNS);
        expect(columns[2].map((c) => c.id)).toEqual(['dark-red', 'mid-red', 'light-red']);
        expect(columns[hueColumn(264)].map((c) => c.id)).toEqual(['blue']);
        expect(greys.map((c) => c.id)).toEqual(['black', 'white']);
        expect(tallest).toBe(3);
    });

    it('is all empty for no colors', () => {
        const { columns, greys, tallest } = layoutHueChart([]);
        expect(columns.every((c) => c.length === 0)).toBe(true);
        expect(greys).toEqual([]);
        expect(tallest).toBe(0);
    });
});
