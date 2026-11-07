import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { HueChartColor } from '@chromesthesia/shared';
import { getHueChart } from '../databaseAPI';
import SectionLabel from '../ui/SectionLabel';
import { songPagePath } from '../../utils/paths';
import { HUE_COLUMNS, HUE_LABELS, layoutHueChart } from '../../utils/hueChart';

/**
 * The chart's scale never goes below this many colors per column, so a small library draws
 * short blocks instead of a few towers.
 */
const MIN_ROWS = 12;

// The hue columns, a gap, then the grey column
const GRID_COLUMNS = `repeat(${HUE_COLUMNS}, minmax(0, 1fr)) 0.5rem minmax(0, 1fr)`;
const GREY_GRID_COLUMN = HUE_COLUMNS + 2;

interface Hovered {
    color: HueChartColor;
    /** Where the color's column is, as a percentage of the chart's width */
    centerPercent: number;
    /** Where the top of the color's block is, as a percentage of the chart's height */
    topPercent: number;
}

const HueTooltip = ({ color, centerPercent, topPercent }: Hovered) => {
    // Near an edge, pin it to that edge so it doesn't hang off the panel
    const horizontal =
        centerPercent < 20
            ? { left: 0 }
            : centerPercent > 80
              ? { right: 0 }
              : { left: `${centerPercent}%`, transform: 'translateX(-50%)' };
    return (
        <div
            role="tooltip"
            className="pointer-events-none absolute z-30 mb-2 w-max max-w-64 rounded-md bg-panel px-3 py-2 text-sm shadow-[0_1px_0_#aeada8,0_6px_16px_rgba(0,0,0,0.18)]"
            style={{ ...horizontal, bottom: `calc(${100 - topPercent}% + 0.25rem)` }}
        >
            <div className="flex items-center gap-2">
                <span
                    className="inline-block size-3 shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
                    style={{ backgroundColor: color.color }}
                />
                <span className="truncate font-bold">{color.title}</span>
            </div>
            <div className="mt-0.5 flex gap-2 text-xs text-silk">
                <span className="truncate">{color.artists.join(', ')}</span>
                <span className="font-mono">{color.color}</span>
            </div>
        </div>
    );
};

/**
 * Every color logged, as one block each: hues run left to right and each column stacks its
 * colors darkest at the bottom to lightest at the top. Greyish colors have no real hue, so they
 * get their own column at the end. Hovering a block names its song (and dims every other song's
 * blocks); clicking opens the song's page.
 */
const HueChart = () => {
    const [colors, setColors] = useState<HueChartColor[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hovered, setHovered] = useState<Hovered | null>(null);

    useEffect(() => {
        let cancelled = false;
        getHueChart()
            .then((loaded) => {
                if (!cancelled) setColors(loaded);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (colors?.length === 0) return null;

    let body;
    if (error) {
        body = (
            <p className="text-sm font-bold text-danger" role="alert">
                {error}
            </p>
        );
    } else if (!colors) {
        body = <p className="text-sm text-silk">Loading…</p>;
    } else {
        const { columns, greys, tallest } = layoutHueChart(colors);
        const rows = Math.max(tallest, MIN_ROWS);
        const gridCount = HUE_COLUMNS + 2;

        const column = (stack: HueChartColor[], gridColumn: number) => (
            <div
                key={gridColumn}
                className="flex flex-col-reverse"
                style={{ gridColumn, gridRow: 1 }}
            >
                {stack.map((color, row) => {
                    const dimmed = hovered !== null && hovered.color.songId !== color.songId;
                    const place = {
                        color,
                        centerPercent: ((gridColumn - 0.5) / gridCount) * 100,
                        topPercent: 100 - ((row + 1) / rows) * 100,
                    };
                    const show = () => setHovered(place);
                    const hide = () =>
                        setHovered((prev) => (prev?.color.id === color.id ? null : prev));
                    return (
                        <Link
                            key={color.id}
                            to={songPagePath(color.songId)}
                            aria-label={`${color.title} by ${color.artists.join(', ')}, ${color.color}`}
                            className="group relative block pt-px outline-none"
                            style={{ height: `${100 / rows}%` }}
                            onMouseEnter={show}
                            onMouseLeave={hide}
                            onFocus={show}
                            onBlur={hide}
                        >
                            <span
                                className={`block h-full rounded-[2px] outline-ink transition-opacity group-hover:outline-2 group-focus-visible:outline-2 ${
                                    dimmed ? 'opacity-30' : ''
                                }`}
                                style={{ backgroundColor: color.color }}
                            />
                        </Link>
                    );
                })}
            </div>
        );

        body = (
            <div>
                <div className="relative">
                    {hovered && colors.includes(hovered.color) && <HueTooltip {...hovered} />}
                    <div
                        className="grid h-44 gap-x-0.5 rounded-[4px] bg-[#c9c8c3] p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] sm:h-56"
                        style={{ gridTemplateColumns: GRID_COLUMNS }}
                    >
                        {columns.map((stack, i) => column(stack, i + 1))}
                        {column(greys, GREY_GRID_COLUMN)}
                    </div>
                </div>
                <div
                    aria-hidden
                    className="mt-1.5 grid gap-x-0.5 px-1 text-[9px] silk tracking-[0.04em]! sm:text-[10px] sm:tracking-[0.14em]!"
                    style={{ gridTemplateColumns: GRID_COLUMNS }}
                >
                    {HUE_LABELS.map(({ label, column: start }, i) => (
                        <span
                            key={label}
                            className="truncate"
                            style={{
                                gridColumnStart: start + 1,
                                gridColumnEnd: (HUE_LABELS[i + 1]?.column ?? HUE_COLUMNS) + 1,
                            }}
                        >
                            {label}
                        </span>
                    ))}
                    <span
                        className="justify-self-center overflow-visible"
                        style={{ gridColumn: GREY_GRID_COLUMN }}
                    >
                        Grey
                    </span>
                </div>
            </div>
        );
    }

    return (
        <section className="flex flex-col gap-4 panel screws p-6">
            <SectionLabel aside={colors ? `${colors.length} colors` : undefined}>
                Every color, by hue
            </SectionLabel>
            {body}
        </section>
    );
};

export default HueChart;
