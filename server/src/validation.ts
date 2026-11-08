import { z } from 'zod';
import type {
    AddColorRequest,
    ColorFamily,
    LoginRequest,
    UpdateSettingsRequest,
    UpdateColorRequest,
    UpsertSongRequest,
} from '@chromesthesia/shared';

// Accepts #rgb or #rrggbb in any case; stores lowercase #rrggbb so "#FFF" and "#ffffff" match
export const hexColor = z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Expected a color like #ff8800')
    .transform((hex) => {
        const digits = hex.slice(1).toLowerCase();
        return digits.length === 3 ? `#${[...digits].map((d) => d + d).join('')}` : `#${digits}`;
    });

// Short descriptors such as "glossy"; blank and repeated notes are rejected
export const notes = z
    .array(z.string().trim().min(1).max(200))
    .max(20)
    .refine((n) => new Set(n).size === n.length, 'Notes must not repeat');

const ms = z.number().int().nonnegative();

const album = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.url(),
    releaseDate: z
        .string()
        .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Expected YYYY, YYYY-MM or YYYY-MM-DD'),
    releaseDatePrecision: z.enum(['year', 'month', 'day']),
    type: z.enum(['album', 'single', 'compilation']),
});

export const upsertSongSchema = z.object({
    title: z.string().min(1),
    artists: z.array(z.string()),
    albumImageUrl: z.url().optional(),
    songUrl: z.url(),
    durationMs: ms.positive().optional(),
    notes: notes.optional(),
    album: album.optional(),
    artistUrls: z.array(z.url()).optional(),
    trackNumber: z.number().int().positive().optional(),
    discNumber: z.number().int().positive().optional(),
}) satisfies z.ZodType<UpsertSongRequest>;

const label = z.string().trim().min(1).max(50);

/** Why a part's times are invalid, or undefined when they're fine (both missing is whole-song). */
export const partError = (startMs?: number, endMs?: number): string | undefined => {
    if ((startMs === undefined) !== (endMs === undefined)) {
        return 'startMs and endMs must be given together';
    }
    if (startMs !== undefined && endMs! <= startMs) return 'endMs must be greater than startMs';
    return undefined;
};

export const addColorSchema = z
    .object({
        color: hexColor,
        startMs: ms.optional(),
        endMs: ms.optional(),
        label: label.optional(),
        notes: notes.optional(),
    })
    .superRefine((c, ctx) => {
        const message = partError(c.startMs, c.endMs);
        if (message) ctx.addIssue({ code: 'custom', message, path: ['endMs'] });
    }) satisfies z.ZodType<AddColorRequest>;

// Times are checked against the stored entry once merged, in the route, with partError()
export const updateColorSchema = z
    .strictObject({
        color: hexColor.optional(),
        startMs: ms.nullable().optional(),
        endMs: ms.nullable().optional(),
        label: label.nullable().optional(),
        notes: notes.nullable().optional(),
    })
    .refine(
        (c) => Object.keys(c).length > 0,
        'Nothing to update',
    ) satisfies z.ZodType<UpdateColorRequest>;

const COLOR_FAMILIES = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'white',
    'black',
] as const satisfies readonly ColorFamily[];

// A "from-to" range of whole numbers from 0 to max, such as "200-260"
const range = (max: number, message: string) =>
    z
        .string()
        .regex(/^\d{1,3}-\d{1,3}$/, message)
        .transform((text) => {
            const [from, to] = text.split('-').map(Number);
            return { from, to };
        })
        .refine((r) => r.from <= max && r.to <= max, message);

// Only these query params are passed through to Mongo, and only as plain strings.
// Passing req.query straight to find() would let ?field[$ne]=x inject operators.
export const listQuerySchema = z
    .object({
        title: z.string().optional(),
        artist: z.string().optional(),
        q: z.string().trim().max(200).optional(),
        decade: z
            .string()
            .regex(/^\d{3}0$/, 'Expected a decade like 1990')
            .transform(Number)
            .optional(),
        color: hexColor.optional(),
        family: z.enum(COLOR_FAMILIES).optional(),
        hue: range(359, 'Expected a hue range like 200-260').optional(),
        light: range(100, 'Expected a lightness range like 30-70')
            .refine((r) => r.from <= r.to, 'Lightness range must go from dark to light')
            .optional(),
        limit: z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(1000))
            .optional(),
    })
    .refine(
        (query) =>
            [query.color, query.family, query.hue ?? query.light].filter((x) => x !== undefined)
                .length <= 1,
        'Search by color, family or range, one at a time',
    );

export const similarQuerySchema = z.object({
    limit: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .pipe(z.number().int().min(1).max(20))
        .optional(),
});

export const randomQuerySchema = z.object({
    not: z.string().optional(),
});

export const loginSchema = z.object({
    password: z.string().min(1).max(1024),
}) satisfies z.ZodType<LoginRequest>;

// At least one setting; unknown keys are rejected so a typo doesn't silently do nothing
export const updateSettingsSchema = z
    .strictObject({
        dailyGoal: z.number().int().min(1).max(100),
    })
    .partial()
    .refine(
        (body) => Object.keys(body).length > 0,
        'Send at least one setting',
    ) satisfies z.ZodType<UpdateSettingsRequest>;
