import { z } from 'zod';
import type { AddColorRequest, UpsertSongRequest } from '@chromesthesia/shared';

// Accepts #rgb or #rrggbb in any case; stores lowercase #rrggbb so "#FFF" and "#ffffff" match
export const hexColor = z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Expected a color like #ff8800')
    .transform((hex) => {
        const digits = hex.slice(1).toLowerCase();
        return digits.length === 3 ? `#${[...digits].map((d) => d + d).join('')}` : `#${digits}`;
    });

// Short descriptors such as "glossy"; blank and repeated notes are rejected
const notes = z
    .array(z.string().trim().min(1).max(200))
    .max(20)
    .refine((n) => new Set(n).size === n.length, 'Notes must not repeat');

export const upsertSongSchema = z.object({
    title: z.string().min(1),
    artists: z.array(z.string()),
    albumImageUrl: z.url().optional(),
    songUrl: z.url(),
    notes: notes.optional(),
}) satisfies z.ZodType<UpsertSongRequest>;

const ms = z.number().int().nonnegative();

export const addColorSchema = z
    .object({
        color: hexColor,
        startMs: ms.optional(),
        endMs: ms.optional(),
        label: z.string().trim().min(1).max(50).optional(),
        notes: notes.optional(),
    })
    .refine((c) => (c.startMs === undefined) === (c.endMs === undefined), {
        message: 'startMs and endMs must be given together',
        path: ['endMs'],
    })
    .refine((c) => c.startMs === undefined || c.endMs! > c.startMs, {
        message: 'endMs must be greater than startMs',
        path: ['endMs'],
    }) satisfies z.ZodType<AddColorRequest>;

// Only these query params are passed through to Mongo, and only as plain strings.
// Passing req.query straight to find() would let ?field[$ne]=x inject operators.
export const listQuerySchema = z.object({
    title: z.string().optional(),
    artist: z.string().optional(),
});
