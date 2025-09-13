import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbQuery, dbQueryOne, dbExecute } from '../database/init';
import { authenticateGlobalAdmin, verifyGlobalAdminCredentials, issueGlobalAdminToken } from '../middleware/globalAdmin';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Global admin login
router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 1 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed' });

  const { email, password } = req.body;
  if (!verifyGlobalAdminCredentials(email, password)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const token = issueGlobalAdminToken(email);
  return res.json({ success: true, data: { token } });
}));

// Create tenant
router.post('/tenants', [
  authenticateGlobalAdmin,
  body('tenantPrefix').matches(/^[a-z0-9_-]{2,30}$/),
  body('name').isLength({ min: 2 }),
  body('adminEmails').isArray({ min: 1 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed' });

  const { tenantPrefix, name, adminEmails } = req.body;
  const id = uuidv4();

  const exists = await dbQueryOne('SELECT id FROM tenants WHERE tenantPrefix = ?', [tenantPrefix]);
  if (exists) throw createError('Tenant prefix already exists', 400);

  await dbExecute(
    'INSERT INTO tenants (id, tenantPrefix, name, adminEmails, createdAt, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [id, tenantPrefix, name, JSON.stringify(adminEmails)]
  );
  return res.status(201).json({ success: true, data: { id, tenantPrefix, name, adminEmails } });
}));

// List tenants
router.get('/tenants', authenticateGlobalAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const rows = await dbQuery('SELECT id, tenantPrefix, name, adminEmails, createdAt, updatedAt FROM tenants ORDER BY createdAt DESC');
  return res.json({ success: true, data: rows });
}));

// Update tenant metadata
router.put('/tenants/:id', [
  authenticateGlobalAdmin,
  body('name').optional().isLength({ min: 2 }),
  body('adminEmails').optional().isArray({ min: 1 })
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: string[] = [];
  const params: any[] = [];
  const { name, adminEmails } = req.body;

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (adminEmails !== undefined) { updates.push('adminEmails = ?'); params.push(JSON.stringify(adminEmails)); }
  if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update' });

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(id);
  await dbExecute(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, params);
  return res.json({ success: true, message: 'Tenant updated' });
}));

export { router as globalRoutes };


