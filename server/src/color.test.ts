import { describe, expect, it } from 'vitest';
import {
    CLOSE_DISTANCE,
    FAMILY_COLORS,
    colorDistance,
    familyOf,
    hexToOkLch,
    inColorRange,
    inHueRange,
    rangeCenterDistance,
    shadeOf,
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

describe('shadeOf', () => {
    it.each([
        ['#ffcccc', 'pale'],
        ['#ff0000', 'mid'],
        ['#800000', 'deep'],
        ['#add8e6', 'pale'],
        ['#000080', 'deep'],
        ['#fff5b0', 'pale'],
        ['#f2d02e', 'mid'], // the yellow swatch: mid, though it's lighter than any mid blue
        ['#006400', 'deep'],
    ])('%s is %s', (hex, shade) => {
        expect(shadeOf(hex)).toBe(shade);
    });

    it('gives white and black no shade', () => {
        expect(shadeOf('#ffffff')).toBeNull();
        expect(shadeOf('#111111')).toBeNull();
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

describe('inHueRange', () => {
    it('includes both ends of the range', () => {
        expect(inHueRange(200, { from: 200, to: 260 })).toBe(true);
        expect(inHueRange(260.5, { from: 200, to: 260 })).toBe(true);
        expect(inHueRange(199.9, { from: 200, to: 260 })).toBe(false);
        expect(inHueRange(261, { from: 200, to: 260 })).toBe(false);
    });

    it('wraps past 360 when from is greater than to', () => {
        const reds = { from: 330, to: 30 };
        expect(inHueRange(350, reds)).toBe(true);
        expect(inHueRange(10, reds)).toBe(true);
        expect(inHueRange(180, reds)).toBe(false);
    });

    it('covers the whole wheel from 0 to 359', () => {
        expect(inHueRange(359.7, { from: 0, to: 359 })).toBe(true);
    });
});

describe('inColorRange', () => {
    it('checks hue and lightness together', () => {
        // #2f6fd6 is about hue 260, lightness 56%
        expect(inColorRange('#2f6fd6', { hue: { from: 240, to: 280 } })).toBe(true);
        expect(inColorRange('#2f6fd6', { light: { from: 50, to: 60 } })).toBe(true);
        expect(
            inColorRange('#2f6fd6', { hue: { from: 240, to: 280 }, light: { from: 70, to: 90 } }),
        ).toBe(false);
    });

    it('leaves greys out of hue ranges but not lightness ranges', () => {
        expect(inColorRange('#808080', { hue: { from: 0, to: 359 } })).toBe(false);
        expect(inColorRange('#808080', { light: { from: 55, to: 65 } })).toBe(true);
    });

    it('counts black and white as 0% and 100% light', () => {
        expect(inColorRange('#000000', { light: { from: 0, to: 0 } })).toBe(true);
        expect(inColorRange('#ffffff', { light: { from: 100, to: 100 } })).toBe(true);
    });
});

describe('rangeCenterDistance', () => {
    it('is 0 in the middle and about 1 at an edge', () => {
        // #808080 is 60% light
        expect(rangeCenterDistance('#808080', { light: { from: 50, to: 70 } })).toBeCloseTo(0, 1);
        expect(rangeCenterDistance('#808080', { light: { from: 60, to: 80 } })).toBeCloseTo(1, 1);
    });

    it('measures a wrapped hue range from its middle', () => {
        // #f2c4ce is about hue 4, close to the middle of 330–40 (5)
        expect(rangeCenterDistance('#f2c4ce', { hue: { from: 330, to: 40 } })).toBeLessThan(0.1);
    });
});
