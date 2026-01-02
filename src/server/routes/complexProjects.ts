import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { dbQuery, dbQueryOne, dbExecute } from '../database/init';
import { authenticateToken, requireUser, AuthRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { CreateComplexProjectRequest, UpdateComplexProjectRequest } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

const createValidation = [
  body('projectName').trim().isLength({ min: 1 }).withMessage('Project Name is required'),
  body('description').trim().isLength({ min: 5 }).withMessage('Description is required'),
  body('salesName').trim().isLength({ min: 1 }).withMessage('Sales Name is required'),
  body('accountName').trim().isLength({ min: 1 }).withMessage('Account Name is required'),
  body('status').isIn(['win', 'loss', 'ongoing']).withMessage('Status must be win, loss, or ongoing'),
  body('keySuccessFactors').custom((value, { req }) => {
    if (req.body.status === 'win') {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Key Success Factors are required when status is Win');
      }
    }
    return true;
  }),
  body('reasonsForLoss').custom((value, { req }) => {
    if (req.body.status === 'loss') {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Reasons for Loss are required when status is Loss');
      }
    }
    return true;
  }),
  body('lessonsLearned').trim().isLength({ min: 3 }).withMessage('Lessons Learned is required'),
  body('suggestionsForImprovement').trim().isLength({ min: 3 }).withMessage('Suggestions for Improvement is required'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
];

const updateValidation = [
  body('status').optional().isIn(['win', 'loss', 'ongoing']).withMessage('Status must be win, loss, or ongoing'),
  body('projectName').optional().trim().isLength({ min: 1 }).withMessage('Project Name is required'),
  body('description').optional().trim().isLength({ min: 5 }).withMessage('Description is required'),
  body('salesName').optional().trim().isLength({ min: 1 }).withMessage('Sales Name is required'),
  body('accountName').optional().trim().isLength({ min: 1 }).withMessage('Account Name is required'),
  body('keySuccessFactors').optional().isString(),
  body('reasonsForLoss').optional().isString(),
  body('lessonsLearned').optional().trim().isLength({ min: 3 }).withMessage('Lessons Learned is required'),
  body('suggestionsForImprovement').optional().trim().isLength({ min: 3 }).withMessage('Suggestions for Improvement is required'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
];

const mapRowToProject = (row: any) => ({
  id: row.id,
  userId: row.userId,
  userName: row.userName,
  projectName: row.projectName,
  description: row.description,
  salesName: row.salesName,
  accountName: row.accountName,
  status: row.status,
  keySuccessFactors: row.keySuccessFactors,
  reasonsForLoss: row.reasonsForLoss,
  lessonsLearned: row.lessonsLearned,
  suggestionsForImprovement: row.suggestionsForImprovement,
  year: row.year ? parseInt(row.year) : new Date(row.createdAt).getFullYear(),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Get all complex projects for current user (admin sees all)
router.get('/', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const year = req.query.year ? parseInt(req.query.year as string) : null; // Optional year filter

  let query = `
    SELECT cp.*, u.fullName as userName
    FROM complex_projects cp
    JOIN users u ON cp.userId = u.id
  `;
  const params: any[] = [];
  const whereConditions: string[] = [];

  if (!isAdmin) {
    whereConditions.push('cp.userId = ?');
    params.push(userId);
  }

  // Filter by year if provided
  // First filter by year field in database
  if (year) {
    whereConditions.push('(cp.year = ? OR cp.year IS NULL)');
    params.push(year);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY cp.createdAt DESC';
  const rows = await dbQuery(query, params);
  let data = rows.map(mapRowToProject);

  // Application-level filter for year (handles NULL year by using createdAt)
  // This ensures we only return data for the selected year
  // When year = 2025: show all data (all existing data is for 2025)
  // When year = 2026: show 0 (no data for 2026 yet)
  if (year) {
    data = data.filter(project => {
      const projectYear = project.year || new Date(project.createdAt).getFullYear();
      return projectYear === year;
    });
  }

  res.json({ success: true, data });
}));

// Get complex project by id
router.get('/:id', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const row = await dbQueryOne(`
    SELECT cp.*, u.fullName as userName
    FROM complex_projects cp
    JOIN users u ON cp.userId = u.id
    WHERE cp.id = ?
  `, [id]);

  if (!row) throw createError('Complex project not found', 404);
  if (req.user!.role !== 'admin' && row.userId !== req.user!.id) {
    throw createError('Access denied', 403);
  }

  res.json({ success: true, data: mapRowToProject(row) });
}));

// Create complex project
router.post('/', requireUser, createValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`, 400);
  }

  const data: CreateComplexProjectRequest = req.body;
  const userId = req.user!.id;

  // Validate account/sales against user permissions
  const allowedAccounts = req.user!.involvedAccountNames || [];
  if (allowedAccounts.length > 0 && !allowedAccounts.includes(data.accountName.trim())) {
    throw createError(`Account "${data.accountName}" not in your allowed list`, 400);
  }

  const allowedSales = req.user!.involvedSaleNames || [];
  if (allowedSales.length > 0 && !allowedSales.includes(data.salesName.trim())) {
    throw createError('Sales Name not in your allowed list', 400);
  }

  // Enforce conditional fields
  if (data.status === 'win' && (!data.keySuccessFactors || data.keySuccessFactors.trim().length === 0)) {
    throw createError('Key Success Factors required when status is Win', 400);
  }
  if (data.status === 'loss' && (!data.reasonsForLoss || data.reasonsForLoss.trim().length === 0)) {
    throw createError('Reasons for Loss required when status is Loss', 400);
  }

  const id = uuidv4();
  await dbExecute(`
    INSERT INTO complex_projects (
      id, userId, projectName, description, salesName, accountName, status,
      keySuccessFactors, reasonsForLoss, lessonsLearned, suggestionsForImprovement, year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    userId,
    data.projectName,
    data.description,
    data.salesName,
    data.accountName,
    data.status,
    data.keySuccessFactors || '',
    data.reasonsForLoss || '',
    data.lessonsLearned,
    data.suggestionsForImprovement,
    data.year || new Date().getFullYear()
  ]);

  res.status(201).json({ success: true, message: 'Complex project saved', data: { id } });
}));

// Update complex project
router.put('/:id', requireUser, updateValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`, 400);
  }

  const existing = await dbQueryOne('SELECT * FROM complex_projects WHERE id = ?', [id]);
  if (!existing) throw createError('Complex project not found', 404);
  if (req.user!.role !== 'admin' && existing.userId !== req.user!.id) {
    throw createError('Access denied', 403);
  }

  const data: UpdateComplexProjectRequest = req.body;

  // Validate permissioned fields (skip for admin)
  if (req.user!.role !== 'admin') {
    if (data.accountName) {
      const allowedAccounts = req.user!.involvedAccountNames || [];
      if (allowedAccounts.length > 0 && !allowedAccounts.includes(data.accountName.trim())) {
        throw createError(`Account "${data.accountName}" not in your allowed list`, 400);
      }
    }

    if (data.salesName) {
      const allowedSales = req.user!.involvedSaleNames || [];
      if (allowedSales.length > 0 && !allowedSales.includes(data.salesName.trim())) {
        throw createError('Sales Name not in your allowed list', 400);
      }
    }
  }

  const finalStatus = data.status || existing.status;
  if (finalStatus === 'win' && (data.keySuccessFactors ?? existing.keySuccessFactors)?.toString().trim().length === 0) {
    throw createError('Key Success Factors required when status is Win', 400);
  }
  if (finalStatus === 'loss' && (data.reasonsForLoss ?? existing.reasonsForLoss)?.toString().trim().length === 0) {
    throw createError('Reasons for Loss required when status is Loss', 400);
  }

  const fields: string[] = [];
  const values: any[] = [];

  const setField = (column: string, value: any) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (data.projectName !== undefined) setField('projectName', data.projectName);
  if (data.description !== undefined) setField('description', data.description);
  if (data.salesName !== undefined) setField('salesName', data.salesName);
  if (data.accountName !== undefined) setField('accountName', data.accountName);
  if (data.status !== undefined) setField('status', data.status);
  if (data.keySuccessFactors !== undefined) setField('keySuccessFactors', data.keySuccessFactors);
  if (data.reasonsForLoss !== undefined) setField('reasonsForLoss', data.reasonsForLoss);
  if (data.lessonsLearned !== undefined) setField('lessonsLearned', data.lessonsLearned);
  if (data.suggestionsForImprovement !== undefined) setField('suggestionsForImprovement', data.suggestionsForImprovement);
  if (data.year !== undefined) setField('year', data.year);

  if (fields.length === 0) {
    throw createError('No fields to update', 400);
  }

  fields.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(id);

  const updateQuery = `UPDATE complex_projects SET ${fields.join(', ')} WHERE id = ?`;
  await dbExecute(updateQuery, values);

  res.json({ success: true, message: 'Complex project updated' });
}));

// Delete complex project (admin or owner)
router.delete('/:id', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await dbQueryOne('SELECT * FROM complex_projects WHERE id = ?', [id]);
  if (!existing) throw createError('Complex project not found', 404);
  if (req.user!.role !== 'admin' && existing.userId !== req.user!.id) {
    throw createError('Access denied', 403);
  }

  await dbExecute('DELETE FROM complex_projects WHERE id = ?', [id]);
  res.json({ success: true, message: 'Complex project deleted' });
}));

export { router as complexProjectRoutes };

