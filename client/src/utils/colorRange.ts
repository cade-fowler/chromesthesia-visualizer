import type { HueRange, LightRange } from '@chromesthesia/shared';

/** A range as it's sent to the API and kept in the URL: "200-260". */
export const formatRange = ({ from, to }: HueRange | LightRange): string => `${from}-${to}`;

const parseRange = (text: string, max: number) => {
    const found = /^(\d{1,3})-(\d{1,3})$/.exec(text);
    if (!found) return undefined;
    const [from, to] = [Number(found[1]), Number(found[2])];
    return from <= max && to <= max ? { from, to } : undefined;
};

/** Reads a hue range such as "330-30" (0–359, wrapping when from > to); undefined if invalid. */
export const parseHueRange = (text: string): HueRange | undefined => parseRange(text, 359);

/** Reads a lightness range such as "30-70" (0–100, from ≤ to); undefined if invalid. */
export const parseLightRange = (text: string): LightRange | undefined => {
    const range = parseRange(text, 100);
    return range && range.from <= range.to ? range : undefined;
};

/** How many degrees a hue range covers, going up from `from`, wrapping past 360. */
const hueSpan = ({ from, to }: HueRange) => (((to - from) % 360) + 360) % 360;

/** The hue in the middle of a range, wrapping past 360. */
export const hueMiddle = (range: HueRange): number =>
    Math.round(range.from + hueSpan(range) / 2) % 360;

/** A range as shown to people: "200°–260°" or "30–70%". */
export const describeHue = ({ from, to }: HueRange) => `${from}°–${to}°`;
export const describeLight = ({ from, to }: LightRange) => `${from}–${to}%`;
