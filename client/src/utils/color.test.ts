import { describe, expect, it } from 'vitest';
import { DARK_TEXT, LIGHT_TEXT, isDark, stripBackground, textColorOn } from './color';

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
