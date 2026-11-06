import { useState } from 'react';
import type { ColorEntry } from '@chromesthesia/shared';
import { textColorOn } from '../../utils/color';
import { formatMs } from '../../utils/time';
import { activeAt, layoutTimeline, timelineLength } from '../../utils/timeline';
import TimelineTooltip from './TimelineTooltip';

const LANE_REM = 2.25;
const GRID_MS = 15_000;
// Each whole-song band gets at least this much height; more bands make the timeline taller.
// Set to 0 to go back to squeezing the bands into the height the parts need.
const MIN_BAND_REM = 1.25;

interface TimelineProps {
    /** A song's colors, in any order */
    entries: ColorEntry[];
    /** The song's length; without it the timeline ends where the last part does */
    durationMs?: number;
    /** Where playback is, to draw the playhead; omit when nothing is playing */
    positionMs?: number | null;
    /** Called when a color is clicked; without it the colors aren't clickable */
    onSelect?: (entry: ColorEntry) => void;
    /** A color to outline, such as the one being edited */
    selectedId?: string;
}

const describe = (entry: ColorEntry) => {
    const range =
        entry.startMs === undefined
            ? 'whole song'
            : `${formatMs(entry.startMs)}–${formatMs(entry.endMs!)}`;
    return [entry.label, range, entry.color, entry.notes?.join(', ')].filter(Boolean).join(' · ');
};

/**
 * How a song's colors change through it. Whole-song colors fill the background as bands;
 * parts sit on top at their place in the song, stacked when they overlap.
 */
const Timeline = ({ entries, durationMs, positionMs, onSelect, selectedId }: TimelineProps) => {
    const [hovered, setHovered] = useState<{ entry: ColorEntry; centerPercent: number } | null>(
        null,
    );
    const length = timelineLength(entries, durationMs);
    if (length === 0) return null;

    const { wholeSong, lanes } = layoutTimeline(entries);
    const percent = (ms: number) => `${(Math.min(ms, length) / length) * 100}%`;
    const showPlayhead = positionMs !== undefined && positionMs !== null;
    const active = new Set(showPlayhead ? activeAt(entries, positionMs).map((e) => e.id) : []);
    const clickable = onSelect ? 'cursor-pointer' : 'cursor-default';
    const hoverProps = (entry: ColorEntry, centerPercent: number) => {
        const show = () => setHovered({ entry, centerPercent });
        const hide = () => setHovered((prev) => (prev?.entry === entry ? null : prev));
        return { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide };
    };
    const partsHeight = Math.max(lanes.length, 1) * LANE_REM + 0.75;
    const height = Math.max(partsHeight, wholeSong.length * MIN_BAND_REM);
    // A faint grid line every 15 seconds, like the bar lines on a track lane. It's a darkening
    // overlay, so it shows on the whole-song colors as well as the bare grey.
    const step = (GRID_MS / length) * 100;
    const gridLines = `repeating-linear-gradient(to right, transparent 0 calc(${step}% - 1px), rgba(0,0,0,0.1) calc(${step}% - 1px) ${step}%)`;

    return (
        <div className="relative">
            {hovered && entries.includes(hovered.entry) && <TimelineTooltip {...hovered} />}
            <div
                className="relative overflow-hidden rounded-[4px] bg-[#c9c8c3] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                style={{ height: `${height}rem` }}
            >
                {/* Backdrop: one horizontal band per whole-song color */}
                <div className="absolute inset-0 flex flex-col">
                    {wholeSong.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            aria-label={`Whole-song color ${describe(entry)}`}
                            className={`flex-1 transition-[filter] hover:brightness-110 ${clickable} ${
                                entry.id === selectedId
                                    ? 'outline-2 -outline-offset-4 outline-ink outline-dashed'
                                    : ''
                            }`}
                            style={{ backgroundColor: entry.color }}
                            {...hoverProps(entry, 50)}
                            onClick={() => onSelect?.(entry)}
                            disabled={!onSelect}
                        />
                    ))}
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: gridLines }}
                />
                {lanes.map((lane, row) =>
                    lane.map((part) => (
                        <button
                            key={part.id}
                            type="button"
                            aria-label={describe(part)}
                            className={`absolute overflow-hidden rounded-[3px] px-1.5 text-left text-[10px] leading-none font-bold tracking-[0.05em] text-ellipsis whitespace-nowrap uppercase transition-[box-shadow] ${clickable} ${
                                active.has(part.id)
                                    ? 'z-10 shadow-[inset_0_0_0_2px_var(--color-ink)]'
                                    : 'shadow-[inset_0_-3px_0_rgba(0,0,0,0.12),0_1px_0_rgba(0,0,0,0.3)]'
                            } ${part.id === selectedId ? 'outline-2 -outline-offset-4 outline-ink outline-dashed' : ''}`}
                            style={{
                                left: percent(part.startMs),
                                width: `calc(${percent(part.endMs - part.startMs)} - 2px)`,
                                top: `${row * LANE_REM + 0.375}rem`,
                                height: `${LANE_REM - 0.375}rem`,
                                backgroundColor: part.color,
                                color: textColorOn(part.color),
                            }}
                            {...hoverProps(part, ((part.startMs + part.endMs) / 2 / length) * 100)}
                            onClick={() => onSelect?.(part)}
                            disabled={!onSelect}
                        >
                            {part.label}
                        </button>
                    )),
                )}
                {showPlayhead && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-ink"
                        style={{ left: percent(positionMs) }}
                    />
                )}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-xs text-silk">
                <span>0:00</span>
                {showPlayhead && <span className="text-ink">{formatMs(positionMs)}</span>}
                <span>{formatMs(length)}</span>
            </div>
        </div>
    );
};

export default Timeline;
