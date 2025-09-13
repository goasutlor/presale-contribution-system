import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
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

// Global overview metrics
router.get('/overview', [
  authenticateGlobalAdmin,
  query('start').optional().isISO8601(),
  query('end').optional().isISO8601()
], asyncHandler(async (req: Request, res: Response) => {
  const start = (req.query.start as string) || '';
  const end = (req.query.end as string) || '';

  // Optional date filters using createdAt
  const whereUsers = start && end ? 'WHERE createdAt BETWEEN ? AND ?' : '';
  const whereContrib = start && end ? 'WHERE createdAt BETWEEN ? AND ?' : '';
  const dateParams = start && end ? [start, end] : [];

  const [{ count: totalTenants = 0 } = { count: 0 }] = await dbQuery('SELECT COUNT(*) as count FROM tenants');
  const [{ count: totalUsers = 0 } = { count: 0 }] = await dbQuery(`SELECT COUNT(*) as count FROM users ${whereUsers}`, dateParams);
  const [{ count: totalContributions = 0 } = { count: 0 }] = await dbQuery(`SELECT COUNT(*) as count FROM contributions ${whereContrib}`, dateParams);

  const byStatus = await dbQuery('SELECT status, COUNT(*) as count FROM contributions GROUP BY status');
  const byImpact = await dbQuery('SELECT impact, COUNT(*) as count FROM contributions GROUP BY impact');

  const topTenants = await dbQuery(`
    SELECT t.tenantPrefix, t.name, COUNT(c.id) as contributions
    FROM contributions c
    LEFT JOIN tenants t ON c.tenantId = t.id
    GROUP BY t.tenantPrefix, t.name
    ORDER BY contributions DESC
    LIMIT 10
  `);

  const recent = await dbQuery(`
    SELECT c.id, c.title, c.status, c.impact, c.updatedAt, u.fullName as userName, t.tenantPrefix
    FROM contributions c
    LEFT JOIN users u ON c.userId = u.id
    LEFT JOIN tenants t ON c.tenantId = t.id
    ORDER BY c.updatedAt DESC
    LIMIT 20
  `);

  const year = new Date().getFullYear();
  const monthly = await dbQuery(
    'SELECT contributionMonth as month, COUNT(*) as count FROM contributions WHERE contributionMonth LIKE ? GROUP BY contributionMonth ORDER BY contributionMonth',
    [`${year}-%`]
  );

  res.json({ success: true, data: {
    totals: { tenants: Number(totalTenants), users: Number(totalUsers), contributions: Number(totalContributions) },
    byStatus, byImpact, topTenants, recent, monthly: { year, data: monthly }
  }});
}));

// Get global timeline data for matrix
router.get('/timeline', [
  authenticateGlobalAdmin
], asyncHandler(async (req: Request, res: Response) => {
  const currentYear = new Date().getFullYear();
  const monthlyData: any[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0');
    const monthName = new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'short' });
    
    const contributions = await dbQuery(`
      SELECT impact FROM contributions 
      WHERE strftime('%Y', createdAt) = ? AND strftime('%m', createdAt) = ?
    `, [currentYear.toString(), monthStr]);
    
    const impactBreakdown = {
      low: contributions.filter((c: any) => c.impact === 'low').length,
      medium: contributions.filter((c: any) => c.impact === 'medium').length,
      high: contributions.filter((c: any) => c.impact === 'high').length,
      critical: contributions.filter((c: any) => c.impact === 'critical').length,
      total: contributions.length
    };
    
    monthlyData.push({
      month: monthStr,
      monthName,
      contributions: impactBreakdown
    });
  }
  
  return res.json({ success: true, data: { year: currentYear, monthlyData } });
}));

// Per-tenant stats
router.get('/tenants/stats', [
  authenticateGlobalAdmin,
  query('start').optional().isISO8601(),
  query('end').optional().isISO8601()
], asyncHandler(async (req: Request, res: Response) => {
  const start = (req.query.start as string) || '';
  const end = (req.query.end as string) || '';
  const whereContrib = start && end ? 'AND c.createdAt BETWEEN ? AND ?' : '';
  const dateParams = start && end ? [start, end] : [];

  const rows = await dbQuery(`
    SELECT 
      t.id as tenantId,
      t.tenantPrefix,
      t.name,
      COUNT(DISTINCT u.id) as users,
      COUNT(DISTINCT c.id) as contributions,
      SUM(CASE WHEN c.status = 'approved' THEN 1 ELSE 0 END) as approved,
      MAX(c.updatedAt) as lastActivity
    FROM tenants t
    LEFT JOIN users u ON u.tenantId = t.id
    LEFT JOIN contributions c ON c.tenantId = t.id ${whereContrib}
    GROUP BY t.id, t.tenantPrefix, t.name
    ORDER BY contributions DESC
  `, dateParams);

  res.json({ success: true, data: rows });
}));

// Global contributions list (cross-tenant)
router.get('/contributions', [
  authenticateGlobalAdmin,
  query('tenantPrefix').optional().isString(),
  query('status').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req: Request, res: Response) => {
  const { tenantPrefix, status } = req.query as any;
  const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  const where: string[] = [];
  const params: any[] = [];
  if (tenantPrefix) { where.push('t.tenantPrefix = ?'); params.push(tenantPrefix); }
  if (status) { where.push('c.status = ?'); params.push(status); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await dbQuery(`
    SELECT c.id, c.title, c.status, c.impact, c.effort, c.accountName, c.saleName, c.contributionMonth,
           c.createdAt, c.updatedAt,
           u.fullName as userName, u.email as userEmail,
           t.tenantPrefix, t.name as tenantName
    FROM contributions c
    LEFT JOIN users u ON c.userId = u.id
    LEFT JOIN tenants t ON c.tenantId = t.id
    ${whereSql}
    ORDER BY c.updatedAt DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  return res.json({ success: true, data: rows });
}));

// Global users list (cross-tenant)
router.get('/users', [authenticateGlobalAdmin, query('search').optional().isString()], asyncHandler(async (req: Request, res: Response) => {
  const search = (req.query.search as string || '').trim();
  let where = '';
  const params: any[] = [];
  if (search) {
    where = 'WHERE u.email LIKE ? OR u.fullName LIKE ? OR u.staffId LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const rows = await dbQuery(`
    SELECT u.id, u.fullName, u.email, u.staffId, u.role, u.status, u.canViewOthers, u.createdAt, u.updatedAt,
           u.tenantId, t.tenantPrefix, t.name as tenantName
    FROM users u
    LEFT JOIN tenants t ON u.tenantId = t.id
    ${where}
    ORDER BY u.createdAt DESC
  `, params);
  res.json({ success: true, data: rows });
}));

// Update global user (role/status/canViewOthers/reassign tenant)
router.put('/users/:id', [
  authenticateGlobalAdmin,
  body('role').optional().isIn(['user', 'admin']),
  body('status').optional().isIn(['pending', 'approved', 'rejected']),
  body('canViewOthers').optional().isBoolean(),
  body('tenantPrefix').optional().matches(/^[a-z0-9_-]{2,30}$/)
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status, canViewOthers, tenantPrefix } = req.body as any;

  const updates: string[] = [];
  const params: any[] = [];
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (canViewOthers !== undefined) { updates.push('canViewOthers = ?'); params.push(Boolean(canViewOthers)); }

  if (tenantPrefix) {
    const t = await dbQueryOne('SELECT id FROM tenants WHERE tenantPrefix = ?', [tenantPrefix]);
    if (!t) throw createError('Tenant not found', 404);
    updates.push('tenantId = ?'); params.push(t.id);
  }
  if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update' });
  updates.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(id);
  await dbExecute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  return res.json({ success: true, message: 'User updated' });
}));

// Delete tenant (safe) - only if no users/contributions
router.delete('/tenants/:id', authenticateGlobalAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const t = await dbQueryOne('SELECT id, tenantPrefix FROM tenants WHERE id = ?', [id]);
  if (!t) throw createError('Tenant not found', 404);
  const [{ count: userCount } = { count: 0 }] = await dbQuery('SELECT COUNT(*) as count FROM users WHERE tenantId = ?', [id]);
  const [{ count: contribCount } = { count: 0 }] = await dbQuery('SELECT COUNT(*) as count FROM contributions WHERE tenantId = ?', [id]);
  if (Number(userCount) > 0 || Number(contribCount) > 0) {
    return res.status(400).json({ success: false, message: 'Tenant has users or contributions. Reassign or delete them first.' });
  }
  await dbExecute('DELETE FROM tenants WHERE id = ?', [id]);
  return res.json({ success: true, message: 'Tenant deleted' });
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


