import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init';
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
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  body('canViewOthers').optional().isBoolean().withMessage('canViewOthers must be a boolean')
];

// Get all users (admin only)
router.get('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const db = getDatabase();
  
  console.log('🔍 Getting all users...');
  
  db.all('SELECT * FROM users ORDER BY fullName', (err, rows: any[]) => {
    if (err) {
      console.error('Database error fetching users:', err);
      throw createError('Failed to fetch users', 500);
    }

    console.log('🔍 Raw database rows:', rows.length);
    rows.forEach((row, index) => {
      console.log(`🔍 Row ${index}:`, {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        status: row.status
      });
    });

    const users = rows.map(row => ({
      id: row.id,
      fullName: row.fullName,
      staffId: row.staffId,
      email: row.email,
      involvedAccountNames: JSON.parse(row.involvedAccountNames),
      involvedSaleNames: JSON.parse(row.involvedSaleNames),
      involvedSaleEmails: JSON.parse(row.involvedSaleEmails),
      role: row.role,
      status: row.status || 'approved', // Include status field
      canViewOthers: Boolean(row.canViewOthers),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
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

    res.json({
      success: true,
      data: users
    });
  });
}));

// Get user by ID
router.get('/:id', canViewUser(':id'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: any) => {
    if (err) {
      console.error('Database error fetching user:', err);
      throw createError('Failed to fetch user', 500);
    }

    if (!row) {
      throw createError('User not found', 404);
    }

    const user = {
      id: row.id,
      fullName: row.fullName,
      staffId: row.staffId,
      email: row.email,
      involvedAccountNames: JSON.parse(row.involvedAccountNames),
      involvedSaleNames: JSON.parse(row.involvedSaleNames),
      involvedSaleEmails: JSON.parse(row.involvedSaleEmails),
      role: row.role,
      status: row.status || 'approved', // Include status field
      canViewOthers: Boolean(row.canViewOthers),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    res.json({
      success: true,
      data: user
    });
  });
}));

// Create new user (admin only)
router.post('/', requireAdmin, createUserValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userData: CreateUserRequest = req.body;
  const db = getDatabase();

  // Check if email already exists
  db.get('SELECT id FROM users WHERE email = ?', [userData.email], (err, row) => {
    if (err) {
      console.error('Database error checking email:', err);
      throw createError('Failed to create user', 500);
    }

    if (row) {
      throw createError('Email already exists', 400);
    }

    // Check if staff ID already exists
    db.get('SELECT id FROM users WHERE staffId = ?', [userData.staffId], (err, row) => {
      if (err) {
        console.error('Database error checking staff ID:', err);
        throw createError('Failed to create user', 500);
      }

      if (row) {
        throw createError('Staff ID already exists', 400);
      }

      // Hash password
      bcrypt.hash(userData.password, 12).then(hashedPassword => {
        const userId = uuidv4();
        
        db.run(`
          INSERT INTO users (id, fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, canViewOthers)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          userData.fullName,
          userData.staffId,
          userData.email,
          hashedPassword,
          JSON.stringify(userData.involvedAccountNames),
          JSON.stringify(userData.involvedSaleNames),
          JSON.stringify(userData.involvedSaleEmails),
          userData.role,
          userData.canViewOthers
        ], function(err) {
          if (err) {
            console.error('Database error creating user:', err);
            throw createError('Failed to create user', 500);
          }

          res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { id: userId }
          });
        });
      });
    });
  });
}));

// Update user
router.put('/:id', requireAdmin, updateUserValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData: UpdateUserRequest = req.body;
  const db = getDatabase();

  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error checking user:', err);
      throw createError('Failed to update user', 500);
    }

    if (!row) {
      throw createError('User not found', 404);
    }

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

    db.run(updateQuery, updateValues, function(err) {
      if (err) {
        console.error('Database error updating user:', err);
        throw createError('Failed to update user', 500);
      }

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    });
  });
}));

// Delete user (admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error checking user:', err);
      throw createError('Failed to delete user', 500);
    }

    if (!row) {
      throw createError('User not found', 404);
    }

    // Delete user
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Database error deleting user:', err);
        throw createError('Failed to delete user', 500);
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    });
  });
}));

// Approve user (admin only)
router.post('/:id/approve', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  console.log('🔍 Approve user request - userId:', id);
  console.log('🔍 Request user:', (req as any).user);

  // Check if user exists
  db.get('SELECT id, status FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking user existence:', err);
      return res.status(500).json({ success: false, message: 'Failed to check user' });
    }

    if (!row) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ User found:', row);

    // Update user status
    db.run(
      'UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', id],
      function(err) {
        if (err) {
          console.error('Error approving user:', err);
          return res.status(500).json({ success: false, message: 'Failed to approve user' });
        }

        console.log('✅ User approved successfully, changes:', this.changes);
        return res.json({ success: true, message: 'User approved successfully' });
      }
    );
    return; // Add return statement
  });
}));

// Reject user (admin only)
router.post('/:id/reject', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  console.log('🔍 Reject user request - userId:', id);
  console.log('🔍 Request user:', (req as any).user);

  // Check if user exists
  db.get('SELECT id, status FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking user existence:', err);
      return res.status(500).json({ success: false, message: 'Failed to check user' });
    }

    if (!row) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ User found:', row);

    // Update user status
    db.run(
      'UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejected', id],
      function(err) {
        if (err) {
          console.error('Error rejecting user:', err);
          return res.status(500).json({ success: false, message: 'Failed to reject user' });
        }

        console.log('✅ User rejected successfully, changes:', this.changes);
        return res.json({ success: true, message: 'User rejected successfully' });
      }
    );
    return; // Add return statement
  });
}));

export { router as userRoutes };
