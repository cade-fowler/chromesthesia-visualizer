import { describe, expect, it } from 'vitest';
import { DARK_TEXT, LIGHT_TEXT, isDark, textColorOn } from './color';

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
