import { Router } from 'express';
import { ObjectId } from 'mongodb';
import type { ApiError } from '@chromesthesia/shared';
import { colors } from '../db.js';

const router = Router();

// ObjectId.isValid() also accepts any 12-character string, so check the hex form directly
const objectIdHex = /^[0-9a-f]{24}$/i;

// Remove one color entry (owner-only once auth lands)
router.delete<{ id: string }, ApiError>('/:id', async (req, res) => {
    if (!objectIdHex.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid color id' });
    }
    const result = await colors().deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: 'Color not found' });
    res.status(204).end();
});

export default router;
