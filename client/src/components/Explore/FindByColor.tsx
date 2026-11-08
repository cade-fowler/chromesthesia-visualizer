import { useEffect, useRef, useState } from 'react';
import type { ColorFamily, HexColor, HueRange, LightRange } from '@chromesthesia/shared';
import SectionLabel from '../ui/SectionLabel';
import RangeSlider from '../ui/RangeSlider';
import Slider from '../ui/Slider';
import { inputClass } from '../ui/fields';
import { smallKeyClass, toggleKeyClass } from '../ui/buttons';
import { hexToHsl, hslToHex, parseHex, type Hsl } from '../../utils/color';
import { FAMILY_SWATCHES } from '../../utils/colorFamilies';
import { describeHue, describeLight, hueMiddle } from '../../utils/colorRange';

/** Sliders search once they've been still this long */
const SLIDER_DEBOUNCE_MS = 250;

/** The color the Hex and HSL modes start on before anything is picked */
const START_COLOR: Hsl = { h: 204, s: 47, l: 67 };

/** The ranges the Range mode starts on before anything is picked */
const START_HUE: HueRange = { from: 200, to: 260 };
const FULL_LIGHT: LightRange = { from: 0, to: 100 };

type Mode = 'swatches' | 'hex' | 'hsl' | 'range';

const MODES: [Mode, string][] = [
    ['swatches', 'Swatches'],
    ['hex', 'Hex'],
    ['hsl', 'HSL'],
    ['range', 'Range'],
];

/** A ranged search: either part can be left out */
interface ColorRanges {
    hue?: HueRange;
    light?: LightRange;
}

/** An OKLCH color for the Range mode's tracks and thumbs (L 0–1), greys when there's no hue */
const oklch = (L: number, hue?: number, chroma = 0.15) =>
    hue === undefined ? `oklch(${L} 0 0)` : `oklch(${L} ${chroma} ${hue})`;

/** The OKLCH hue wheel, which the server's ranges are measured in */
const OKLCH_HUE_TRACK = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) =>
    oklch(0.72, i * 30),
).join(', ')})`;

/** The hue rainbow, vivid whatever the saturation, so the track always shows where hues are */
const HUE_TRACK = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
    .map((h) => `hsl(${h} 85% 55%)`)
    .join(', ')})`;

interface FindByColorProps {
    /** The exact color being searched for (Hex and HSL modes) */
    color?: HexColor;
    /** The family being searched for (Swatches mode) */
    family?: ColorFamily;
    /**
     * Searches for songs close to a color. `replace` swaps the current history entry instead of
     * adding one, for slider moves, which aren't steps worth going back to.
     */
    onColor: (color: HexColor | undefined, replace?: boolean) => void;
    onFamily: (family: ColorFamily | undefined, replace?: boolean) => void;
    /** The hue range being searched for (Range mode) */
    hue?: HueRange;
    /** The lightness range being searched for (Range mode) */
    light?: LightRange;
    /** Searches by range; leaving both parts out stops searching by range */
    onRange: (ranges: ColorRanges, replace?: boolean) => void;
    /** Stops any search by color */
    onClear: () => void;
    /** How many songs the current color search found, once it has loaded */
    count?: number;
}

/**
 * Search by color. Swatches (the default) find songs with any color in a family such as "red";
 * Hex and HSL find songs with a color close to an exact one; Range finds songs with colors in a
 * range of OKLCH hue and/or lightness.
 */
const FindByColor = ({
    color,
    family,
    onColor,
    onFamily,
    hue,
    light,
    onRange,
    onClear,
    count,
}: FindByColorProps) => {
    const [mode, setMode] = useState<Mode>(color ? 'hex' : hue || light ? 'range' : 'swatches');
    // The color being dialed in; the search follows it
    const [draft, setDraft] = useState<Hsl>(() => (color ? hexToHsl(color) : START_COLOR));
    const [hexText, setHexText] = useState(() => color ?? hslToHex(START_COLOR));
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const draftHex = hslToHex(draft);
    // The ranges being dialed in (Range mode). With anyHue on, the hue range is left out.
    const [hueDraft, setHueDraft] = useState<HueRange>(hue ?? START_HUE);
    const [anyHue, setAnyHue] = useState(!hue);
    const [lightDraft, setLightDraft] = useState<LightRange>(light ?? FULL_LIGHT);

    useEffect(() => () => clearTimeout(timer.current), []);

    // Follow a search that changes from outside, such as the back button or a shared link
    const [synced, setSynced] = useState({ color, family, hue, light });
    if (
        color !== synced.color ||
        family !== synced.family ||
        hue?.from !== synced.hue?.from ||
        hue?.to !== synced.hue?.to ||
        light?.from !== synced.light?.from ||
        light?.to !== synced.light?.to
    ) {
        setSynced({ color, family, hue, light });
        if (color && color !== synced.color) {
            if (mode === 'swatches') setMode('hex');
            if (draftHex !== color) setDraft(hexToHsl(color));
            setHexText(color);
        }
        if (family && family !== synced.family) setMode('swatches');
        if (hue || light) {
            setMode('range');
            if (hue) setHueDraft(hue);
            setAnyHue(!hue);
            setLightDraft(light ?? FULL_LIGHT);
        }
    }

    const changeMode = (next: Mode) => {
        if (next === mode) return;
        clearTimeout(timer.current);
        setMode(next);
        // The panel only searches the way its mode shows
        if (color && next !== 'hex' && next !== 'hsl') onColor(undefined);
        else if (family && next !== 'swatches') onFamily(undefined);
        else if ((hue || light) && next !== 'range') onRange({});
    };

    // Range mode: searches the ranges, leaving out a part that doesn't narrow anything
    const searchRanges = (
        next: { hue: HueRange; anyHue: boolean; light: LightRange },
        replace: boolean,
    ) => {
        const fullLight = next.light.from === 0 && next.light.to === 100;
        onRange(
            {
                hue: next.anyHue ? undefined : next.hue,
                light: fullLight ? undefined : next.light,
            },
            replace,
        );
    };
    const ranges = { hue: hueDraft, anyHue, light: lightDraft };
    // Slider moves: show the range now, search once the slider settles
    const slideRange = (next: typeof ranges) => {
        setHueDraft(next.hue);
        setLightDraft(next.light);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => searchRanges(next, true), SLIDER_DEBOUNCE_MS);
    };
    const toggleAnyHue = () => {
        clearTimeout(timer.current);
        setAnyHue(!anyHue);
        searchRanges({ ...ranges, anyHue: !anyHue }, false);
    };
    // The hue the Range mode's light track and thumbs are tinted with
    const rangeHue = anyHue ? undefined : hueMiddle(hueDraft);

    // Slider moves: show the color now, search once the slider settles
    const slide = (next: Hsl) => {
        setDraft(next);
        const hex = hslToHex(next);
        setHexText(hex);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => onColor(hex, true), SLIDER_DEBOUNCE_MS);
    };

    const typedHex = parseHex(hexText);
    // HSL is rounded, so a searched hex may not survive the round trip; show the hex itself
    const shownHex = typedHex ?? draftHex;
    const searchTyped = () => {
        if (!typedHex) return;
        clearTimeout(timer.current);
        setDraft(hexToHsl(typedHex));
        onColor(typedHex);
    };

    const active =
        color !== undefined || family !== undefined || hue !== undefined || light !== undefined;
    const counted = count === undefined ? '' : ` · ${count} ${count === 1 ? 'song' : 'songs'}`;
    const swatch = FAMILY_SWATCHES.find((s) => s.family === family);
    let hint: string;
    if (mode === 'range') {
        const parts = [hue && describeHue(hue), light && `${describeLight(light)} light`];
        hint =
            hue || light
                ? `Songs with colors at ${parts.filter(Boolean).join(', ')}${counted}`
                : 'Slide to a range of lightness, or turn off Any hue to pick hues';
    } else if (mode === 'swatches') {
        hint = swatch
            ? `Songs with any ${swatch.label.toLowerCase()} color${counted}`
            : 'Pick a color to find songs with anything like it';
    } else {
        hint = color
            ? `Songs with a color close to ${color}${counted}`
            : mode === 'hex'
              ? 'Type a color and press Search, or slide the hue'
              : 'Slide to a color';
    }

    return (
        <div className="flex flex-col gap-4 panel screws p-6">
            <SectionLabel
                aside={
                    active ? (
                        <button
                            type="button"
                            className={smallKeyClass}
                            onClick={() => {
                                clearTimeout(timer.current);
                                onClear();
                            }}
                        >
                            Clear
                        </button>
                    ) : undefined
                }
            >
                Find by color
            </SectionLabel>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Search by">
                {MODES.map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        className={toggleKeyClass(mode === value)}
                        aria-pressed={mode === value}
                        onClick={() => changeMode(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {mode === 'swatches' && (
                <div
                    className="grid grid-cols-4 gap-x-3 gap-y-3 sm:grid-cols-8"
                    role="group"
                    aria-label="Color families"
                >
                    {FAMILY_SWATCHES.map((s) => {
                        const on = family === s.family;
                        return (
                            <button
                                key={s.family}
                                type="button"
                                aria-pressed={on}
                                onClick={() => onFamily(on ? undefined : s.family)}
                                className="group flex flex-col items-center gap-1.5"
                            >
                                <span
                                    className={`block h-11 w-full pad outline-offset-2 outline-ink transition-transform group-active:translate-y-0.5 ${on ? 'translate-y-0.5 outline-2' : 'group-hover:outline-1'}`}
                                    style={{ background: s.hex }}
                                />
                                <span
                                    className={`text-[10px] ${on ? 'font-bold tracking-[0.14em] text-ink uppercase' : 'silk'}`}
                                >
                                    {s.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {mode === 'hex' && (
                <>
                    <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            searchTyped();
                        }}
                    >
                        <span
                            aria-hidden
                            className="block size-9 shrink-0 pad"
                            style={{ background: shownHex }}
                        />
                        <input
                            className={`${inputClass} h-9 flex-1`}
                            aria-label="Hex color"
                            placeholder="#7fb3d5"
                            spellCheck={false}
                            autoComplete="off"
                            value={hexText}
                            onChange={(e) => setHexText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className={`${smallKeyClass} h-9!`}
                            disabled={!typedHex}
                        >
                            Search
                        </button>
                    </form>
                    <Slider
                        label="Hue"
                        value={draft.h}
                        min={0}
                        max={359}
                        onChange={(h) => slide({ ...draft, h })}
                        track={HUE_TRACK}
                        thumb={draftHex}
                        readout={`${draft.h}°`}
                    />
                </>
            )}

            {mode === 'hsl' && (
                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <span
                            aria-hidden
                            className="block size-16 pad"
                            style={{ background: shownHex }}
                        />
                        <span className="font-mono text-[11px]">{shownHex}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <Slider
                            label="Hue"
                            value={draft.h}
                            min={0}
                            max={359}
                            onChange={(h) => slide({ ...draft, h })}
                            track={HUE_TRACK}
                            thumb={draftHex}
                            readout={`${draft.h}°`}
                        />
                        <Slider
                            label="Sat"
                            value={draft.s}
                            min={0}
                            max={100}
                            onChange={(s) => slide({ ...draft, s })}
                            track={`linear-gradient(to right, hsl(${draft.h} 0% ${draft.l}%), hsl(${draft.h} 100% ${draft.l}%))`}
                            thumb={draftHex}
                            readout={`${draft.s}%`}
                        />
                        <Slider
                            label="Light"
                            value={draft.l}
                            min={0}
                            max={100}
                            onChange={(l) => slide({ ...draft, l })}
                            track={`linear-gradient(to right, #000, hsl(${draft.h} ${draft.s}% 50%), #fff)`}
                            thumb={draftHex}
                            readout={`${draft.l}%`}
                        />
                    </div>
                </div>
            )}

            {mode === 'range' && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className={toggleKeyClass(anyHue)}
                            aria-pressed={anyHue}
                            onClick={toggleAnyHue}
                        >
                            Any hue
                        </button>
                    </div>
                    <RangeSlider
                        label="Hue"
                        value={hueDraft}
                        min={0}
                        max={359}
                        wraps
                        disabled={anyHue}
                        onChange={(next) => slideRange({ ...ranges, hue: next })}
                        track={OKLCH_HUE_TRACK}
                        thumbs={[oklch(0.72, hueDraft.from), oklch(0.72, hueDraft.to)]}
                        readout={anyHue ? 'Any' : describeHue(hueDraft)}
                        valueText={(n) => `${n}°`}
                    />
                    <RangeSlider
                        label="Light"
                        value={lightDraft}
                        min={0}
                        max={100}
                        onChange={(next) => slideRange({ ...ranges, light: next })}
                        track={`linear-gradient(to right, ${oklch(0, rangeHue, 0.1)}, ${oklch(0.5, rangeHue, 0.1)}, ${oklch(1, rangeHue, 0)})`}
                        thumbs={[
                            oklch(lightDraft.from / 100, rangeHue, 0.1),
                            oklch(lightDraft.to / 100, rangeHue, 0.1),
                        ]}
                        readout={describeLight(lightDraft)}
                        valueText={(n) => `${n}%`}
                    />
                </div>
            )}

            <p className="text-xs text-silk" aria-live="polite">
                {hint}
            </p>
        </div>
    );
};

export default FindByColor;
