import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { CollectionProgress } from '@chromesthesia/shared';
import { getProgress, getSettings, updateSettings } from '../../databaseAPI';
import SectionLabel from '../../ui/SectionLabel';
import AlbumArt from '../../ui/AlbumArt';
import { iconKeyClass, keyClass, toggleKeyClass } from '../../ui/buttons';
import { FAMILY_SWATCHES } from '../../../utils/colorFamilies';
import {
    MILESTONES,
    PROMPT_KINDS,
    RECENT_PROMPTS,
    buildPrompts,
    crossedMilestone,
    dayCounts,
    milestone,
    pickPrompt,
    refreshPrompt,
    type Prompt,
    type PromptKind,
} from '../../../utils/logbook';

const STORAGE_KEY = 'logbook';
const CHANNEL_SIZE = 10;
const MILESTONE_SEGMENTS = 20;
const ALL_KINDS = PROMPT_KINDS.map((k) => k.kind);

/** What the Logbook remembers in this browser. */
interface Stored {
    open?: boolean;
    kinds?: PromptKind[];
    prompt?: string;
    recent?: string[];
}

const readStored = (): Stored => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Stored;
    } catch {
        return {};
    }
};

const writeStored = (stored: Stored) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // Private windows can refuse storage; the Logbook still works, it just forgets
    }
};

// Open by default from lg up, where the Studio's left panel has room; collapsed on phones
const wideScreen = () => window.matchMedia?.('(min-width: 1024px)').matches ?? true;

interface LogbookProps {
    /** Bumped whenever a color or song is saved or deleted, so the counts load again */
    version: number;
    /** Called when a save takes the song total past a milestone */
    onMilestone: (songs: number) => void;
}

/**
 * The owner's logbook in the Studio: today's songs against the daily goal, the streak,
 * milestones, a prompt suggesting what to log next, and how well each color and decade is
 * covered.
 */
const Logbook = ({ version, onMilestone }: LogbookProps) => {
    const [initial] = useState(readStored);
    const [open, setOpen] = useState(initial.open ?? wideScreen());
    const [kinds, setKinds] = useState<PromptKind[]>(() => {
        const valid = (initial.kinds ?? []).filter((kind) => ALL_KINDS.includes(kind));
        return valid.length > 0 ? valid : ALL_KINDS;
    });
    const [recent, setRecent] = useState<string[]>(initial.recent ?? []);
    const [progress, setProgress] = useState<CollectionProgress | null>(null);
    const [goal, setGoal] = useState<number | null>(null);
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [error, setError] = useState<string | null>(null);
    // The song total from the last load, to spot a milestone being crossed
    const lastSongs = useRef<number | null>(null);
    // The prompt to bring back from the last visit, used once
    const storedPrompt = useRef(initial.prompt);

    const prompts = useMemo(() => (progress ? buildPrompts(progress) : []), [progress]);
    const kindSet = useMemo(() => new Set(kinds), [kinds]);

    useEffect(() => {
        getSettings()
            .then((settings) => setGoal(settings.dailyGoal))
            .catch((err: Error) => setError(err.message));
    }, []);

    useEffect(() => {
        let cancelled = false;
        getProgress()
            .then((loaded) => {
                if (cancelled) return;
                setProgress(loaded);
                setError(null);
                const crossed =
                    lastSongs.current === null
                        ? undefined
                        : crossedMilestone(lastSongs.current, loaded.songs);
                if (crossed !== undefined) onMilestone(crossed);
                lastSongs.current = loaded.songs;
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
        // onMilestone changes every render; only a new version should reload
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]);

    // Keep the prompt in step with fresh counts: bring back the remembered one on the first
    // load, and draw a new one when it's been filled or its kind is switched off
    useEffect(() => {
        if (!progress) return;
        setPrompt((current) => {
            const key = current?.key ?? storedPrompt.current;
            storedPrompt.current = undefined;
            const kept = current
                ? refreshPrompt(current, prompts)
                : (prompts.find((p) => p.key === key) ?? null);
            if (kept && kindSet.has(kept.kind)) return kept;
            return pickPrompt(prompts, kindSet, current ? [...recent, current.key] : recent);
        });
        // recent only steers the next draw; it shouldn't cause one
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompts, kindSet]);

    useEffect(() => {
        writeStored({ open, kinds, prompt: prompt?.key, recent });
    }, [open, kinds, prompt, recent]);

    const shuffle = () => {
        const avoid = prompt ? [...recent, prompt.key].slice(-RECENT_PROMPTS) : recent;
        setRecent(avoid);
        setPrompt(pickPrompt(prompts, kindSet, avoid));
    };

    // At least one kind stays on, so Shuffle always has something to draw from
    const toggleKind = (kind: PromptKind) =>
        setKinds((prev) =>
            prev.includes(kind)
                ? prev.length > 1
                    ? prev.filter((k) => k !== kind)
                    : prev
                : ALL_KINDS.filter((k) => k === kind || prev.includes(k)),
        );

    const changeGoal = (by: number) => {
        if (goal === null) return;
        const next = Math.min(100, Math.max(1, goal + by));
        if (next === goal) return;
        setGoal(next);
        updateSettings({ dailyGoal: next }).catch((err: Error) => {
            setGoal(goal);
            setError(err.message);
        });
    };

    const day = progress && goal !== null ? dayCounts(progress.loggedAt, new Date(), goal) : null;

    return (
        <section className="flex flex-col gap-4">
            <SectionLabel
                aside={
                    <button
                        type="button"
                        className="font-body text-[11px] silk hover:text-ink"
                        aria-expanded={open}
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        {open ? 'Hide' : 'Show'}
                    </button>
                }
            >
                Logbook
            </SectionLabel>
            {error && (
                <p className="text-sm font-bold text-danger" role="alert">
                    {error}
                </p>
            )}
            {!progress || !day || goal === null ? (
                !error && <p className="text-sm text-silk">Loading…</p>
            ) : open ? (
                <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Today day={day} goal={goal} onChangeGoal={changeGoal} />
                        <Milestones songs={progress.songs} />
                    </div>
                    <PromptCard
                        prompt={prompt}
                        kinds={kinds}
                        onShuffle={shuffle}
                        onToggleKind={toggleKind}
                    />
                    <Coverage progress={progress} />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-3 well rounded-md px-4 py-3 text-left"
                >
                    <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                        {String(day.today).padStart(2, '0')}/{goal}
                    </span>
                    <Pips lit={day.today} goal={goal} />
                    {day.streak > 0 && (
                        <span className="shrink-0 text-[10px] silk">{day.streak} day streak</span>
                    )}
                    {prompt && (
                        <span className="hidden min-w-0 truncate text-sm sm:inline">
                            {prompt.text}
                        </span>
                    )}
                </button>
            )}
        </section>
    );
};

/** One LED per song of the goal, lit for each song logged today. */
const Pips = ({ lit, goal }: { lit: number; goal: number }) => (
    <span className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: goal }, (_, i) => (
            <span
                key={i}
                className={`size-2.5 rounded-full ${
                    i < lit
                        ? 'bg-ink shadow-[0_0_0_2px_rgba(28,28,29,0.15)]'
                        : 'bg-ink/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]'
                }`}
            />
        ))}
    </span>
);

interface TodayProps {
    day: ReturnType<typeof dayCounts>;
    goal: number;
    onChangeGoal: (by: number) => void;
}

const Today = ({ day, goal, onChangeGoal }: TodayProps) => (
    <div className="flex flex-col gap-3 well rounded-md p-4">
        <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl leading-none font-medium tabular-nums">
                {String(day.today).padStart(2, '0')}
            </span>
            <span className="font-mono text-sm text-silk tabular-nums">/ {goal}</span>
            <span className="text-[10px] silk">Today</span>
            {day.overflow > 0 && (
                <span className="ml-auto font-mono text-sm font-medium tabular-nums">
                    +{day.overflow}
                </span>
            )}
        </div>
        <Pips lit={day.today} goal={goal} />
        <div className="mt-auto flex items-center justify-between gap-3">
            <span className="text-[10px] silk">
                {day.streak > 0 ? `${day.streak} day streak` : 'No streak yet'}
            </span>
            <span className="flex items-center gap-1.5">
                <button
                    type="button"
                    className={iconKeyClass}
                    onClick={() => onChangeGoal(-1)}
                    disabled={goal <= 1}
                    aria-label="Lower the daily goal"
                >
                    −
                </button>
                <span className="w-14 text-center text-[10px] silk">Goal {goal}</span>
                <button
                    type="button"
                    className={iconKeyClass}
                    onClick={() => onChangeGoal(1)}
                    disabled={goal >= 100}
                    aria-label="Raise the daily goal"
                >
                    +
                </button>
            </span>
        </div>
    </div>
);

const Milestones = ({ songs }: { songs: number }) => {
    const { prev, next } = milestone(songs);
    const filled = Math.floor(((songs - prev) / (next - prev)) * MILESTONE_SEGMENTS);
    // The last few milestones passed, then the next one
    const ladder = [...MILESTONES.filter((m) => m < next), next].slice(-5);

    return (
        <div className="flex flex-col gap-3 well rounded-md p-4">
            <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl leading-none font-medium tabular-nums">
                    {String(songs).padStart(4, '0')}
                </span>
                <span className="text-[10px] silk">Songs</span>
            </div>
            <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: MILESTONE_SEGMENTS }, (_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 flex-1 rounded-[1px] ${i < filled ? 'bg-ink' : 'bg-ink/12'}`}
                    />
                ))}
            </div>
            <div className="mt-auto flex items-center justify-between gap-3">
                <span className="text-[10px] silk">
                    Next {next} · {next - songs} to go
                </span>
                <span className="flex gap-1.5 font-mono text-[10px] tabular-nums">
                    {ladder.map((m) => (
                        <span key={m} className={m <= songs ? 'text-ink' : 'text-silk/50'}>
                            {m}
                        </span>
                    ))}
                </span>
            </div>
        </div>
    );
};

interface PromptCardProps {
    prompt: Prompt | null;
    kinds: PromptKind[];
    onShuffle: () => void;
    onToggleKind: (kind: PromptKind) => void;
}

const PromptCard = ({ prompt, kinds, onShuffle, onToggleKind }: PromptCardProps) => (
    <div className="flex flex-col gap-3 well rounded-md p-4">
        <div className="flex min-h-12 items-center gap-4">
            {prompt?.swatch && (
                <span className="size-12 shrink-0 pad" style={{ backgroundColor: prompt.swatch }} />
            )}
            {prompt?.kind === 'album' && (
                <AlbumArt src={prompt.imageUrl} alt="" className="size-12 text-xl" />
            )}
            <div className="min-w-0 flex-1">
                <p className="text-base font-medium">
                    {prompt?.text ?? 'Nothing to suggest for these kinds'}
                </p>
                {prompt && <p className="mt-1 text-[10px] silk">{prompt.detail}</p>}
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={keyClass} onClick={onShuffle} disabled={!prompt}>
                Shuffle
            </button>
            {prompt && (
                <Link to={prompt.to} className={keyClass}>
                    Go
                </Link>
            )}
            <span className="ml-auto flex flex-wrap gap-1.5" role="group" aria-label="Prompt kinds">
                {PROMPT_KINDS.map(({ kind, label }) => (
                    <button
                        key={kind}
                        type="button"
                        className={toggleKeyClass(kinds.includes(kind))}
                        aria-pressed={kinds.includes(kind)}
                        onClick={() => onToggleKind(kind)}
                    >
                        {label}
                    </button>
                ))}
            </span>
        </div>
    </div>
);

const decadeLabel = (decade: number) => `’${String(decade).slice(2)}`;

/** Channels like a mixer's meters: songs per color family, then per decade. */
const Coverage = ({ progress }: { progress: CollectionProgress }) => {
    const families = new Map(progress.families.map((f) => [f.family, f]));
    return (
        <div className="flex flex-col gap-4 well rounded-md p-4">
            <div className="grid grid-cols-8 gap-2">
                {FAMILY_SWATCHES.map(({ family, label }) => {
                    const { songs = 0, colors = [] } = families.get(family) ?? {};
                    return (
                        <div
                            key={family}
                            className="flex flex-col items-stretch gap-1.5"
                            title={`${label} · ${songs} song${songs === 1 ? '' : 's'}`}
                        >
                            <div className="flex flex-col-reverse gap-0.5">
                                {Array.from({ length: CHANNEL_SIZE }, (_, i) => (
                                    <span
                                        key={i}
                                        className={`h-2 rounded-[1px] ${colors[i] ? '' : 'bg-ink/10'}`}
                                        style={
                                            colors[i] ? { backgroundColor: colors[i] } : undefined
                                        }
                                    />
                                ))}
                            </div>
                            <span className="text-center text-[9px] silk">{label.slice(0, 3)}</span>
                        </div>
                    );
                })}
            </div>
            <div
                className="grid gap-1.5"
                style={{
                    gridTemplateColumns: `repeat(${progress.decades.length}, minmax(0, 1fr))`,
                }}
            >
                {progress.decades.map(({ decade, songs }) => (
                    <div
                        key={decade}
                        className="flex flex-col items-stretch gap-1.5"
                        title={`${decade}s · ${songs} song${songs === 1 ? '' : 's'}`}
                    >
                        <div className="flex flex-col-reverse gap-px">
                            {Array.from({ length: CHANNEL_SIZE }, (_, i) => (
                                <span
                                    key={i}
                                    className={`h-1 rounded-[1px] ${i < songs ? 'bg-ink/75' : 'bg-ink/10'}`}
                                />
                            ))}
                        </div>
                        <span className="text-center font-mono text-[9px] text-silk">
                            {decadeLabel(decade)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Logbook;
