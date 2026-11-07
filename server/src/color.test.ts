import { describe, expect, it } from 'vitest';
import {
    CLOSE_DISTANCE,
    FAMILY_COLORS,
    colorDistance,
    familyOf,
    hexToOkLch,
    songDistance,
} from './color.js';

describe('colorDistance', () => {
    it('is 0 for the same color and about 1 from black to white', () => {
        expect(colorDistance('#7fb3d5', '#7fb3d5')).toBe(0);
        expect(colorDistance('#000000', '#ffffff')).toBeCloseTo(1, 5);
    });

    it('is symmetric', () => {
        expect(colorDistance('#ff0000', '#00ff00')).toBeCloseTo(
            colorDistance('#00ff00', '#ff0000'),
            10,
        );
    });

    it('puts neighboring hues closer than opposite ones', () => {
        expect(colorDistance('#ff0000', '#ff4000')).toBeLessThan(
            colorDistance('#ff0000', '#00ffff'),
        );
    });
});

describe('hexToOkLch', () => {
    it('gives greys no chroma', () => {
        expect(hexToOkLch('#808080').C).toBeCloseTo(0, 4);
    });

    it('gives pure red its OKLCH hue of about 29°', () => {
        expect(hexToOkLch('#ff0000').h).toBeCloseTo(29.2, 0);
    });
});

describe('familyOf', () => {
    it.each([
        ['#ff0000', 'red'],
        ['#800000', 'red'], // maroon
        ['#f2c4ce', 'red'], // pastel pink
        ['#ff69b4', 'red'], // hot pink, just below 360°
        ['#ff8000', 'orange'],
        ['#8b4513', 'orange'], // brown
        ['#ffff00', 'yellow'],
        ['#f3dc7a', 'yellow'],
        ['#00ff00', 'green'],
        ['#8fc1b5', 'green'], // sage, near the green/blue boundary
        ['#00ffff', 'blue'],
        ['#7fb3d5', 'blue'],
        ['#000080', 'blue'], // navy is dark but still clearly blue
        ['#8000ff', 'purple'],
        ['#ff00ff', 'purple'],
        ['#b79ad1', 'purple'],
        ['#ffffff', 'white'],
        ['#efeae0', 'white'], // cream is too grey to have a hue
        ['#c0c0c0', 'white'], // light grey
        ['#000000', 'black'],
        ['#404040', 'black'], // dark grey
        ['#1a0505', 'black'], // too dark to see its red
    ])('puts %s in %s', (hex, family) => {
        expect(familyOf(hex)).toBe(family);
    });

    it('puts each swatch color in its own family', () => {
        for (const [family, hex] of Object.entries(FAMILY_COLORS)) {
            expect(familyOf(hex)).toBe(family);
        }
    });
});

describe('colorDistance with chroma weighting', () => {
    it("doesn't count a grey as close to a muted color of the same lightness", () => {
        // A dark grey and a dark brown, and a mid grey and a dark green
        expect(colorDistance('#5b5b5b', '#725037')).toBeGreaterThan(CLOSE_DISTANCE);
        expect(colorDistance('#393939', '#073b32')).toBeGreaterThan(CLOSE_DISTANCE);
    });

    it('still counts neighboring hues and slightly different greys as close', () => {
        expect(colorDistance('#ff0000', '#ff4400')).toBeLessThan(CLOSE_DISTANCE);
        expect(colorDistance('#393939', '#2e2d2a')).toBeLessThan(CLOSE_DISTANCE);
    });
});

describe('songDistance', () => {
    it('is 0 for the same palette, whatever the order', () => {
        expect(songDistance(['#ff0000', '#0000ff'], ['#0000ff', '#ff0000'])).toEqual({
            distance: 0,
            close: 2,
        });
    });

    it('scores the same either way round', () => {
        const a = ['#ff0000', '#0000ff'] as const;
        const b = ['#ff4400'] as const;
        expect(songDistance([...a], [...b]).distance).toBeCloseTo(
            songDistance([...b], [...a]).distance,
            10,
        );
    });

    it('rises with an extra color the other song lacks', () => {
        const base = songDistance(['#ff0000'], ['#ff0000']).distance;
        const extra = songDistance(['#ff0000'], ['#ff0000', '#00ff00']).distance;
        expect(extra).toBeGreaterThan(base);
    });

    it('averages each color with its closest match, both ways', () => {
        const far = colorDistance('#0000ff', '#ff0000');
        // red→red 0, blue→red far: mean far/2. Back: red→red 0. Overall far/4.
        expect(songDistance(['#ff0000', '#0000ff'], ['#ff0000']).distance).toBeCloseTo(far / 4);
    });

    it('weighs a color logged several times more', () => {
        const once = songDistance(['#ff0000', '#0000ff'], ['#ff0000']).distance;
        const twice = songDistance(['#ff0000', '#ff0000', '#0000ff'], ['#ff0000']).distance;
        expect(twice).toBeLessThan(once);
    });

    it("counts a's colors with a close match in b", () => {
        expect(songDistance(['#ff0000', '#fe0101', '#0000ff'], ['#ff0000']).close).toBe(2);
    });
});
