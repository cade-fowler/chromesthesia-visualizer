import type { ColorEntry } from '@chromesthesia/shared';
import { formatMs } from '../../utils/time';

interface TimelineTooltipProps {
    entry: ColorEntry;
    /** Where to center it, as a percentage of the timeline's width */
    centerPercent: number;
}

/** Details of the color under the pointer, shown above the timeline: notes, part and times. */
const TimelineTooltip = ({ entry, centerPercent }: TimelineTooltipProps) => {
    const range =
        entry.startMs === undefined
            ? 'Whole song'
            : `${formatMs(entry.startMs)}–${formatMs(entry.endMs!)}`;

    // Near an edge, pin it to that edge so it doesn't hang off the panel
    const position =
        centerPercent < 20
            ? { left: 0 }
            : centerPercent > 80
              ? { right: 0 }
              : { left: `${centerPercent}%`, transform: 'translateX(-50%)' };

    return (
        <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full z-30 mb-2 w-max max-w-72 rounded-md bg-panel px-3 py-2 text-sm shadow-[0_1px_0_#aeada8,0_6px_16px_rgba(0,0,0,0.18)]"
            style={position}
        >
            <div className="flex items-center gap-2">
                <span
                    className="inline-block size-3 shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
                    style={{ backgroundColor: entry.color }}
                />
                {entry.label && <span className="font-bold">{entry.label}</span>}
                <span className="font-mono text-xs text-silk">{range}</span>
            </div>
            {entry.notes && entry.notes.length > 0 && (
                <div className="mt-1 text-silk italic">{entry.notes.join(', ')}</div>
            )}
        </div>
    );
};

export default TimelineTooltip;
