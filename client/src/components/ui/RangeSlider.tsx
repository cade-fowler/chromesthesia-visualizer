import { useState, type CSSProperties } from 'react';

export interface Range {
    from: number;
    to: number;
}

interface RangeSliderProps {
    /** Printed to the left of the track; each thumb is named after it ("Hue from", "Hue to") */
    label: string;
    value: Range;
    min: number;
    max: number;
    onChange: (value: Range) => void;
    /** The track's CSS background, e.g. a gradient showing what each position gives */
    track: string;
    /** The fills of the from and to thumbs */
    thumbs: [string, string];
    /** The range as shown at the right, e.g. "200°–260°" */
    readout: string;
    /** How each thumb's value is read out to screen readers, e.g. "200°" */
    valueText: (value: number) => string;
    /**
     * Whether `from` may pass `to`, making a range that wraps round the end of the track (hue).
     * Otherwise the thumbs stop at each other.
     */
    wraps?: boolean;
    disabled?: boolean;
}

/** The panel color, laid over the parts of the track outside the range */
const DIM = 'rgb(226 225 220 / 0.8)';

/** The overlay that dims the track outside the range; a wrapped range dims the middle. */
const dimmed = (from: number, to: number) =>
    from <= to
        ? `linear-gradient(to right, ${DIM} ${from}%, transparent ${from}% ${to}%, ${DIM} ${to}%)`
        : `linear-gradient(to right, transparent ${to}%, ${DIM} ${to}% ${from}%, transparent ${from}%)`;

/**
 * A labelled slider with two thumbs, for picking a range of one part of a color. The track is
 * painted like Slider's, with the part outside the range dimmed.
 */
const RangeSlider = ({
    label,
    value,
    min,
    max,
    onChange,
    track,
    thumbs,
    readout,
    valueText,
    wraps = false,
    disabled = false,
}: RangeSliderProps) => {
    // The thumb moved last sits on top, so two thumbs at the same spot can always be pulled apart
    const [top, setTop] = useState<'from' | 'to'>('to');
    const percent = (n: number) => ((n - min) / (max - min)) * 100;

    const move = (which: 'from' | 'to', n: number) => {
        setTop(which);
        if (wraps) onChange({ ...value, [which]: n });
        else if (which === 'from') onChange({ ...value, from: Math.min(n, value.to) });
        else onChange({ ...value, to: Math.max(n, value.from) });
    };

    return (
        <div
            className={`grid grid-cols-[3.25rem_minmax(0,1fr)_4.75rem] items-center gap-3 ${disabled ? 'opacity-45' : ''}`}
        >
            <span className="text-[10px] silk">{label}</span>
            <div className="relative slider-track" style={{ '--track': track } as CSSProperties}>
                <span
                    aria-hidden
                    className="absolute inset-0 rounded-[4px]"
                    style={{ background: dimmed(percent(value.from), percent(value.to)) }}
                />
                {(['from', 'to'] as const).map((which, i) => (
                    <input
                        key={which}
                        type="range"
                        className="slider-range"
                        aria-label={`${label} ${which}`}
                        aria-valuetext={valueText(value[which])}
                        min={min}
                        max={max}
                        value={value[which]}
                        disabled={disabled}
                        onChange={(e) => move(which, Number(e.target.value))}
                        style={
                            {
                                '--thumb': thumbs[i],
                                zIndex: top === which ? 2 : 1,
                            } as CSSProperties
                        }
                    />
                ))}
            </div>
            <span className="text-right font-mono text-xs">{readout}</span>
        </div>
    );
};

export default RangeSlider;
