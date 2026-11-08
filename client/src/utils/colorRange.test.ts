import { describe, expect, it } from 'vitest';
import { formatRange, hueMiddle, parseHueRange, parseLightRange } from './colorRange';

describe('parseHueRange', () => {
    it('reads a range, including one that wraps past 360', () => {
        expect(parseHueRange('200-260')).toEqual({ from: 200, to: 260 });
        expect(parseHueRange('330-30')).toEqual({ from: 330, to: 30 });
    });

    it('rejects anything else', () => {
        for (const text of ['', '200', '200-360', '-10-20', 'a-b', '200-260-300']) {
            expect(parseHueRange(text)).toBeUndefined();
        }
    });

    it('round-trips with formatRange', () => {
        expect(formatRange(parseHueRange('330-30')!)).toBe('330-30');
    });
});

describe('parseLightRange', () => {
    it('reads a range from dark to light', () => {
        expect(parseLightRange('0-100')).toEqual({ from: 0, to: 100 });
    });

    it('rejects one that goes backwards or past 100', () => {
        expect(parseLightRange('70-30')).toBeUndefined();
        expect(parseLightRange('0-101')).toBeUndefined();
    });
});

describe('hueMiddle', () => {
    it('finds the middle, wrapping past 360', () => {
        expect(hueMiddle({ from: 200, to: 260 })).toBe(230);
        expect(hueMiddle({ from: 330, to: 30 })).toBe(0);
    });
});
