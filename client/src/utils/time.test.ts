import { describe, expect, it } from 'vitest';
import { formatMs, parseTime } from './time';

describe('formatMs', () => {
    it.each([
        [0, '0:00'],
        [999, '0:00'],
        [5000, '0:05'],
        [75000, '1:15'],
        [3_600_000, '60:00'],
        [-10, '0:00'],
    ])('formats %i as %s', (ms, text) => {
        expect(formatMs(ms)).toBe(text);
    });
});

describe('parseTime', () => {
    it.each([
        ['1:15', 75000],
        ['0:05', 5000],
        [' 2:00 ', 120000],
        ['1:15.5', 75500],
        ['75', 75000],
        ['7.5', 7500],
        ['0', 0],
    ])('parses %s as %i', (text, ms) => {
        expect(parseTime(text)).toBe(ms);
    });

    it.each(['', 'abc', '1:60', '1:5', '1:', ':30', '-5', '1:2:3'])('rejects %j', (text) => {
        expect(parseTime(text)).toBeNull();
    });

    it('round-trips with formatMs', () => {
        expect(parseTime(formatMs(194000))).toBe(194000);
    });
});
