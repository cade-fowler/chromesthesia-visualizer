import { Router } from 'express';
import { z } from 'zod';
import type { ApiError, OwnerSettings } from '@chromesthesia/shared';
import { requireOwner } from '../auth.js';
import { settings, type SettingsDoc } from '../db.js';
import { updateSettingsSchema } from '../validation.js';

const router = Router();

/** What each setting is until the owner changes it. */
export const DEFAULT_SETTINGS: OwnerSettings = { dailyGoal: 10 };

const withDefaults = (doc: SettingsDoc | null): OwnerSettings => ({
    dailyGoal: doc?.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal,
});

// The settings are private to the owner, so reading them needs the login too
router.use(requireOwner);

router.get<Record<string, never>, OwnerSettings | ApiError>('/', async (_req, res) => {
    res.json(withDefaults(await settings().findOne({ _id: 'owner' })));
});

// Changes only the settings given
router.patch<Record<string, never>, OwnerSettings | ApiError>('/', async (req, res) => {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: z.prettifyError(parsed.error) });
    const doc = await settings().findOneAndUpdate(
        { _id: 'owner' },
        { $set: parsed.data },
        { upsert: true, returnDocument: 'after' },
    );
    res.json(withDefaults(doc));
});

export default router;
