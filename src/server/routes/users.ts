import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { dbQuery, dbQueryOne, dbExecute } from '../database/init';
import { authenticateToken, requireAdmin, canViewUser, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { CreateUserRequest, UpdateUserRequest, User } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation for creating users
const createUserValidation = [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('staffId').trim().isLength({ min: 1 }).withMessage('Staff ID is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('involvedAccountNames').isArray({ min: 1 }).withMessage('At least one account is required'),
  body('involvedSaleNames').isArray({ min: 1 }).withMessage('At least one sale name is required'),
  body('involvedSaleEmails').isArray({ min: 1 }).withMessage('At least one sale email is required'),
  body('blogLinks').isArray().withMessage('Blog links must be an array'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  body('canViewOthers').isBoolean().withMessage('canViewOthers must be a boolean')
];

// Validation for updating users
const updateUserValidation = [
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('staffId').optional().trim().isLength({ min: 1 }).withMessage('Staff ID is required'),
  body('involvedAccountNames').optional().isArray({ min: 1 }).withMessage('At least one account is required'),
  body('involvedSaleNames').optional().isArray({ min: 1 }).withMessage('At least one sale name is required'),
  body('involvedSaleEmails').optional().isArray({ min: 1 }).withMessage('At least one sale email is required'),
  body('blogLinks').optional().isArray().withMessage('Blog links must be an array'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  body('canViewOthers').optional().isBoolean().withMessage('canViewOthers must be a boolean')
];

// Get all users (admin only)
router.get('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  console.log('🔍 Getting all users...');
  const rows = await dbQuery('SELECT * FROM users ORDER BY fullName');

  console.log('🔍 Raw database rows:', rows.length);
  rows.forEach((row: any, index: number) => {
    console.log(`🔍 Row ${index}:`, {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      status: row.status
    });
  });

  const users = rows.map((row: any) => ({
      id: row.id,
      fullName: row.fullName,
      staffId: row.staffId,
      email: row.email,
      involvedAccountNames: Array.isArray(row.involvedAccountNames) ? row.involvedAccountNames : (row.involvedAccountNames ? JSON.parse(row.involvedAccountNames) : []),
      involvedSaleNames: Array.isArray(row.involvedSaleNames) ? row.involvedSaleNames : (row.involvedSaleNames ? JSON.parse(row.involvedSaleNames) : []),
      involvedSaleEmails: Array.isArray(row.involvedSaleEmails) ? row.involvedSaleEmails : (row.involvedSaleEmails ? JSON.parse(row.involvedSaleEmails) : []),
      blogLinks: Array.isArray(row.blogLinks) ? row.blogLinks : (row.blogLinks ? JSON.parse(row.blogLinks) : []),
      role: row.role,
      status: row.status || 'approved', // Include status field
      canViewOthers: Boolean(row.canViewOthers),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null
  }));

  console.log('🔍 Processed users:', users.length);
  users.forEach((user, index) => {
    console.log(`🔍 Processed user ${index}:`, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      status: user.status
    });
  });

  res.json({ success: true, data: users });
}));

// Get user by ID
router.get('/:id', canViewUser(':id'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const row: any = await dbQueryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!row) throw createError('User not found', 404);

  const user = {
    id: row.id,
    fullName: row.fullName,
    staffId: row.staffId,
    email: row.email,
    involvedAccountNames: Array.isArray(row.involvedAccountNames) ? row.involvedAccountNames : (row.involvedAccountNames ? JSON.parse(row.involvedAccountNames) : []),
    involvedSaleNames: Array.isArray(row.involvedSaleNames) ? row.involvedSaleNames : (row.involvedSaleNames ? JSON.parse(row.involvedSaleNames) : []),
    involvedSaleEmails: Array.isArray(row.involvedSaleEmails) ? row.involvedSaleEmails : (row.involvedSaleEmails ? JSON.parse(row.involvedSaleEmails) : []),
    blogLinks: Array.isArray(row.blogLinks) ? row.blogLinks : (row.blogLinks ? JSON.parse(row.blogLinks) : []),
    role: row.role,
    status: row.status || 'approved',
    canViewOthers: Boolean(row.canViewOthers),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null
  };

  res.json({ success: true, data: user });
}));

// Create new user (admin only)
router.post('/', requireAdmin, createUserValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userData: CreateUserRequest = req.body;
  // Check if email or staffId already exists
  const exists = await dbQueryOne('SELECT id FROM users WHERE email = ? OR staffId = ?', [userData.email, userData.staffId]);
  if (exists) throw createError('Email or staff ID already exists', 400);

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const userId = uuidv4();
  await dbExecute(
    `INSERT INTO users (id, fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, blogLinks, role, canViewOthers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      userData.fullName,
      userData.staffId,
      userData.email,
      hashedPassword,
      JSON.stringify(userData.involvedAccountNames),
      JSON.stringify(userData.involvedSaleNames),
      JSON.stringify(userData.involvedSaleEmails),
      JSON.stringify(userData.blogLinks || []),
      userData.role,
      userData.canViewOthers
    ]
  );
  res.status(201).json({ success: true, message: 'User created successfully', data: { id: userId } });
}));

// Update user
router.put('/:id', requireAdmin, updateUserValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData: UpdateUserRequest = req.body;
  const row = await dbQueryOne('SELECT id FROM users WHERE id = ?', [id]);
  if (!row) throw createError('User not found', 404);

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updateData.fullName !== undefined) {
      updateFields.push('fullName = ?');
      updateValues.push(updateData.fullName);
    }

    if (updateData.staffId !== undefined) {
      updateFields.push('staffId = ?');
      updateValues.push(updateData.staffId);
    }

    if (updateData.involvedAccountNames !== undefined) {
      updateFields.push('involvedAccountNames = ?');
      updateValues.push(JSON.stringify(updateData.involvedAccountNames));
    }

    if (updateData.involvedSaleNames !== undefined) {
      updateFields.push('involvedSaleNames = ?');
      updateValues.push(JSON.stringify(updateData.involvedSaleNames));
    }

    if (updateData.involvedSaleEmails !== undefined) {
      updateFields.push('involvedSaleEmails = ?');
      updateValues.push(JSON.stringify(updateData.involvedSaleEmails));
    }

    if (updateData.blogLinks !== undefined) {
      updateFields.push('blogLinks = ?');
      updateValues.push(JSON.stringify(updateData.blogLinks));
    }

    if (updateData.role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(updateData.role);
    }

    if (updateData.canViewOthers !== undefined) {
      updateFields.push('canViewOthers = ?');
      updateValues.push(updateData.canViewOthers);
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await dbExecute(updateQuery, updateValues);
    res.json({ success: true, message: 'User updated successfully' });
}));

// Delete user (admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const row = await dbQueryOne('SELECT id FROM users WHERE id = ?', [id]);
  if (!row) throw createError('User not found', 404);
  await dbExecute('DELETE FROM users WHERE id = ?', [id]);
  res.json({ success: true, message: 'User deleted successfully' });
}));

// Approve user (admin only)
router.post('/:id/approve', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('🔍 Approve user request - userId:', id);
  console.log('🔍 Request user:', (req as any).user);

  const row = await dbQueryOne('SELECT id, status FROM users WHERE id = ?', [id]);
  if (!row) { console.log('❌ User not found with ID:', id); return res.status(404).json({ success: false, message: 'User not found' }); }
  console.log('✅ User found:', row);
  await dbExecute('UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['approved', id]);
  return res.json({ success: true, message: 'User approved successfully' });
}));

// Reject user (admin only)
router.post('/:id/reject', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('🔍 Reject user request - userId:', id);
  console.log('🔍 Request user:', (req as any).user);

  const row = await dbQueryOne('SELECT id, status FROM users WHERE id = ?', [id]);
  if (!row) { console.log('❌ User not found with ID:', id); return res.status(404).json({ success: false, message: 'User not found' }); }
  console.log('✅ User found:', row);
  await dbExecute('UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['rejected', id]);
  return res.json({ success: true, message: 'User rejected successfully' });
}));

export { router as userRoutes };
