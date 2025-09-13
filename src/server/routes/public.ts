import { Router, Request, Response } from 'express';
import { dbQuery } from '../database/init';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public tenant directory (safe subset only)
router.get('/tenant-directory', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const rows = await dbQuery('SELECT tenantPrefix, name FROM tenants ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    // If tenants table is missing (e.g., SQLite dev), return default only
    res.json({ success: true, data: [{ tenantPrefix: 'default', name: 'Default' }] });
  }
}));

export { router as publicRoutes };


