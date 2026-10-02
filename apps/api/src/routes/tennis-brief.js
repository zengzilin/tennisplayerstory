import { Router } from 'express';
import { fetchTennisBrief } from '../utils/tennisBrief.js';

const router = Router();

// Keep ingestion and retention in Tennis Brief; expose its public data on our origin.
router.get(['/articles', '/status'], async (req, res) => {
  try {
    const data = await fetchTennisBrief(req.path.slice(1), req.query);
    res.set('Cache-Control', 'public, max-age=60').json(data);
  } catch (error) {
    if (error instanceof RangeError) return res.status(400).json({ error: error.message });
    res.set('Cache-Control', 'no-store').status(502).json({ error: 'Tennis Brief is temporarily unavailable' });
  }
});

export default router;
