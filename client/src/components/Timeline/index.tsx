import type { ColorEntry } from '@chromesthesia/shared';
import { textColorOn } from '../../utils/color';
import { formatMs } from '../../utils/time';
import { activeAt, layoutTimeline, timelineLength } from '../../utils/timeline';

const LANE_REM = 2.25;
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
    const length = timelineLength(entries, durationMs);
    if (length === 0) return null;

    const { wholeSong, lanes } = layoutTimeline(entries);
    const percent = (ms: number) => `${(Math.min(ms, length) / length) * 100}%`;
    const showPlayhead = positionMs !== undefined && positionMs !== null;
    const active = new Set(showPlayhead ? activeAt(entries, positionMs).map((e) => e.id) : []);
    const clickable = onSelect ? 'cursor-pointer' : 'cursor-default';
    const partsHeight = Math.max(lanes.length, 1) * LANE_REM + 0.75;
    const height = Math.max(partsHeight, wholeSong.length * MIN_BAND_REM);

    return (
        <div className="mt-[3%]">
            <div
                className="relative overflow-hidden rounded-[10px] border-2 border-medium bg-white/5"
                style={{ height: `${height}rem` }}
            >
                {/* Backdrop: one horizontal band per whole-song color */}
                <div className="absolute inset-0 flex flex-col">
                    {wholeSong.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            title={describe(entry)}
                            aria-label={`Whole-song color ${describe(entry)}`}
                            className={`flex-1 transition-opacity hover:opacity-80 ${clickable} ${
                                entry.id === selectedId
                                    ? 'opacity-90 outline-2 -outline-offset-4 outline-light outline-dashed'
                                    : 'opacity-60'
                            }`}
                            style={{ backgroundColor: entry.color }}
                            onClick={() => onSelect?.(entry)}
                            disabled={!onSelect}
                        />
                    ))}
                </div>
                {lanes.map((lane, row) =>
                    lane.map((part) => (
                        <button
                            key={part.id}
                            type="button"
                            title={describe(part)}
                            aria-label={describe(part)}
                            className={`absolute overflow-hidden rounded-[6px] px-1.5 text-left text-xs leading-none text-ellipsis whitespace-nowrap shadow-md ring-black/40 transition-[box-shadow,transform] ${clickable} ${
                                active.has(part.id)
                                    ? 'z-10 scale-y-110 ring-3 ring-light!'
                                    : 'ring-1'
                            }`}
                            style={{
                                left: percent(part.startMs),
                                width: `calc(${percent(part.endMs - part.startMs)} - 2px)`,
                                top: `${row * LANE_REM + 0.375}rem`,
                                height: `${LANE_REM - 0.375}rem`,
                                backgroundColor: part.color,
                                color: textColorOn(part.color),
                            }}
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
                        className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-light shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                        style={{ left: percent(positionMs) }}
                    />
                )}
            </div>
            <div className="mt-1 flex justify-between text-xs text-medium">
                <span>0:00</span>
                {showPlayhead && <span className="text-light">{formatMs(positionMs)}</span>}
                <span>{formatMs(length)}</span>
            </div>
        </div>
    );
};

export default Timeline;
