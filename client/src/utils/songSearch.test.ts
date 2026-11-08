import { describe, expect, it } from 'vitest';
import { hasFilters, readSearch, searchQuery, writeSearch } from './songSearch';

const params = (text: string) => new URLSearchParams(text);

describe('readSearch', () => {
    it('reads every part of the search', () => {
        expect(
            readSearch(params('q=+frank+&decade=2010&hue=330-30&light=20-80&sort=title')),
        ).toEqual({
            q: 'frank',
            decade: 2010,
            color: undefined,
            family: undefined,
            hue: { from: 330, to: 30 },
            light: { from: 20, to: 80 },
            sort: 'title',
        });
    });

    it('reads a color without its #, and drops bad values', () => {
        const search = readSearch(params('color=7FB3D5&family=pink&decade=1995&sort=random'));
        expect(search.color).toBe('#7fb3d5');
        expect(search.family).toBeUndefined();
        expect(search.decade).toBeUndefined();
        expect(search.sort).toBeUndefined();
    });
});

describe('writeSearch', () => {
    it('sets and removes params', () => {
        const next = writeSearch(params('q=a&decade=1990'), {
            q: '',
            color: '#7fb3d5',
            sort: 'artist',
        });
        expect(next.toString()).toBe('decade=1990&color=7fb3d5&sort=artist');
    });

    it('keeps one kind of color search at a time', () => {
        expect(writeSearch(params('color=ff0000&q=a'), { family: 'red' }).toString()).toBe(
            'q=a&family=red',
        );
        expect(writeSearch(params('family=red'), { hue: { from: 200, to: 260 } }).toString()).toBe(
            'hue=200-260',
        );
        expect(
            writeSearch(params('hue=200-260&light=10-20'), { light: undefined }).toString(),
        ).toBe('hue=200-260');
    });
});

describe('hasFilters and searchQuery', () => {
    it("doesn't count the sort as a filter or send it", () => {
        const search = readSearch(params('sort=title'));
        expect(hasFilters(search)).toBe(false);
        expect(searchQuery(search)).toEqual({
            decade: undefined,
            color: undefined,
            family: undefined,
            hue: undefined,
            light: undefined,
        });
    });
});
