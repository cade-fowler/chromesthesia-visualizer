import { describe, expect, it } from 'vitest';
import {
    DARK_TEXT,
    LIGHT_TEXT,
    hexToHsl,
    hslToHex,
    isDark,
    parseHex,
    stripBackground,
    textColorOn,
} from './color';

describe('isDark', () => {
    it.each([
        ['#000000', true],
        ['#1c1c1c', true],
        ['#ffffff', false],
        ['#f5f5f5', false],
        ['#ff0000', true], // average channel = 85
        ['#ffff00', false], // average channel = 170
    ])('%s -> %s', (hex, expected) => {
        expect(isDark(hex)).toBe(expected);
    });
});

describe('textColorOn', () => {
    it('uses light text on dark colors and dark text on light colors', () => {
        expect(textColorOn('#000000')).toBe(LIGHT_TEXT);
        expect(textColorOn('#ffffff')).toBe(DARK_TEXT);
    });
});

describe('stripBackground', () => {
    it('is undefined for no colors', () => {
        expect(stripBackground([])).toBeUndefined();
    });

    it('is the color itself for one color', () => {
        expect(stripBackground(['#ff0000'])).toBe('#ff0000');
    });

    it('gives each color an equal hard-edged band, in order', () => {
        expect(stripBackground(['#ff0000', '#00ff00', '#0000ff', '#000000'])).toBe(
            'linear-gradient(to right, #ff0000 0% 25%, #00ff00 25% 50%, #0000ff 50% 75%, #000000 75% 100%)',
        );
    });
});

describe('parseHex', () => {
    it.each([
        ['#7FB3D5', '#7fb3d5'],
        ['7fb3d5', '#7fb3d5'],
        [' #abc ', '#aabbcc'],
        ['f80', '#ff8800'],
    ])('reads %j as %s', (text, hex) => {
        expect(parseHex(text)).toBe(hex);
    });

    it.each(['', '#', '#12345', '#1234567', 'red', '#ggg'])('rejects %j', (text) => {
        expect(parseHex(text)).toBeNull();
    });
});

describe('hexToHsl and hslToHex', () => {
    it.each([
        ['#ff0000', { h: 0, s: 100, l: 50 }],
        ['#00ff00', { h: 120, s: 100, l: 50 }],
        ['#0000ff', { h: 240, s: 100, l: 50 }],
        ['#ffffff', { h: 0, s: 0, l: 100 }],
        ['#000000', { h: 0, s: 0, l: 0 }],
        ['#808080', { h: 0, s: 0, l: 50 }],
    ])('converts %s to and from HSL', (hex, hsl) => {
        expect(hexToHsl(hex)).toEqual(hsl);
        expect(hslToHex(hsl)).toBe(hex);
    });

    it('round-trips an everyday color within rounding', () => {
        const back = hslToHex(hexToHsl('#7fb3d5'));
        const diff = [1, 3, 5].map((i) =>
            Math.abs(
                parseInt(back.slice(i, i + 2), 16) - parseInt('7fb3d5'.slice(i - 1, i + 1), 16),
            ),
        );
        expect(Math.max(...diff)).toBeLessThanOrEqual(3);
    });
});
