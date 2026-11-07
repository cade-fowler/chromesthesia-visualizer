import type { CSSProperties } from 'react';

interface SliderProps {
    /** Printed to the left of the track; also the slider's accessible name */
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    /** The track's CSS background, e.g. a gradient showing what each position gives */
    track: string;
    /** The thumb's fill: the color the slider is set to */
    thumb: string;
    /** The value as shown at the right, e.g. "204°" */
    readout: string;
}

/** A labelled slider with a painted track and a readout, for picking one part of a color. */
const Slider = ({ label, value, min, max, onChange, track, thumb, readout }: SliderProps) => (
    <label className="grid grid-cols-[3.25rem_minmax(0,1fr)_3rem] items-center gap-3">
        <span className="text-[10px] silk">{label}</span>
        <input
            type="range"
            className="slider"
            min={min}
            max={max}
            value={value}
            aria-valuetext={readout}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ '--track': track, '--thumb': thumb } as CSSProperties}
        />
        <span className="text-right font-mono text-xs">{readout}</span>
    </label>
);

export default Slider;
