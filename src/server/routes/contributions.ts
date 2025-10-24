import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { dbQuery, dbQueryOne, dbExecute } from '../database/init';
import { authenticateToken, requireUser, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { CreateContributionRequest, UpdateContributionRequest, Contribution } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const parseJsonArraySafe = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
};

// Validation for creating contributions
const createContributionValidation = [
  body('accountName').trim().isLength({ min: 1 }).withMessage('Account name is required'),
  body('saleName').trim().isLength({ min: 1 }).withMessage('Sale name is required'),
  body('saleEmail').isEmail().normalizeEmail().withMessage('Valid sale email is required'),
  body('contributionType').isIn(['technical', 'business', 'relationship', 'innovation', 'other']).withMessage('Valid contribution type is required'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('impact').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid impact level is required'),
  body('effort').isIn(['low', 'medium', 'high']).withMessage('Valid effort level is required'),
  body('estimatedImpactValue').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'number') return true;
    if (typeof value === 'string' && !isNaN(Number(value))) return true;
    throw new Error('Estimated impact value must be a number');
  }),
  body('contributionMonth').isLength({ min: 7 }).withMessage('Valid contribution month is required (YYYY-MM)'),
  body('status').optional().isIn(['draft', 'submitted']).withMessage('Valid status is required'),
  body('tags').custom((value) => {
    // Allow both array and string (comma-separated)
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return true;
    if (value === undefined || value === null) return true;
    throw new Error('Tags must be an array or string');
  })
];

// Validation for updating contributions
const updateContributionValidation = [
  body('accountName').optional().trim().isLength({ min: 1 }).withMessage('Account name is required'),
  body('saleName').optional().trim().isLength({ min: 1 }).withMessage('Sale name is required'),
  body('saleEmail').optional().isEmail().normalizeEmail().withMessage('Valid sale email is required'),
  body('contributionType').optional().isIn(['technical', 'business', 'relationship', 'innovation', 'other']).withMessage('Valid contribution type is required'),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('impact').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid impact level is required'),
  body('effort').optional().isIn(['low', 'medium', 'high']).withMessage('Valid effort level is required'),
  body('estimatedImpactValue').optional().isNumeric().withMessage('Estimated impact value must be a number'),
  body('contributionMonth').optional().isLength({ min: 7 }).withMessage('Valid contribution month is required (YYYY-MM)'),
  body('status').optional().isIn(['draft', 'submitted']).withMessage('Valid status is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

// Get all contributions for current user (or all for admin)
router.get('/', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  
  // Build query based on user role
  let query = `
    SELECT c.*, u.fullName as userName 
    FROM contributions c 
    JOIN users u ON c.userId = u.id 
  `;
  let params: any[] = [];
  
  if (!isAdmin) {
    query += ' WHERE c.userId = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY c.createdAt DESC';
  const rows = await dbQuery(query, params);

  const contributions = rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      accountName: row.accountName,
      saleName: row.saleName,
      saleEmail: row.saleEmail,
      contributionType: row.contributionType,
      title: row.title,
      description: row.description,
      impact: row.impact,
      effort: row.effort,
      estimatedImpactValue: row.estimatedImpactValue || 0,
      contributionMonth: row.contributionMonth,
      status: row.status,
      saleApproval: Boolean(row.saleApproval),
      saleApprovalDate: row.saleApprovalDate,
      saleApprovalNotes: row.saleApprovalNotes,
      attachments: parseJsonArraySafe(row.attachments),
      tags: parseJsonArraySafe(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

  res.json({ success: true, data: contributions });
}));

// Get all contributions (admin view)
router.get('/admin', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  const rows = await dbQuery(`
    SELECT c.*, u.fullName as userName 
    FROM contributions c 
    JOIN users u ON c.userId = u.id 
    ORDER BY c.createdAt DESC
  `);

  const contributions = rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      accountName: row.accountName,
      saleName: row.saleName,
      saleEmail: row.saleEmail,
      contributionType: row.contributionType,
      title: row.title,
      description: row.description,
      impact: row.impact,
      effort: row.effort,
      estimatedImpactValue: row.estimatedImpactValue || 0,
      contributionMonth: row.contributionMonth,
      status: row.status,
      saleApproval: Boolean(row.saleApproval),
      saleApprovalDate: row.saleApprovalDate,
      saleApprovalNotes: row.saleApprovalNotes,
      attachments: parseJsonArraySafe(row.attachments),
      tags: parseJsonArraySafe(row.tags),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
  }));

  res.json({ success: true, data: contributions });
}));

// Get contribution by ID
router.get('/:id', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const row = await dbQueryOne(`
    SELECT c.*, u.fullName as userName 
    FROM contributions c 
    JOIN users u ON c.userId = u.id 
    WHERE c.id = ?
  `, [id]);

  if (!row) throw createError('Contribution not found', 404);
  if (req.user!.role !== 'admin' && row.userId !== userId) throw createError('Access denied', 403);

  const contribution = {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    accountName: row.accountName,
    saleName: row.saleName,
    saleEmail: row.saleEmail,
    contributionType: row.contributionType,
    title: row.title,
    description: row.description,
    impact: row.impact,
    effort: row.effort,
    estimatedImpactValue: row.estimatedImpactValue || 0,
    contributionMonth: row.contributionMonth,
    status: row.status,
    saleApproval: Boolean(row.saleApproval),
    saleApprovalDate: row.saleApprovalDate,
    saleApprovalNotes: row.saleApprovalNotes,
    attachments: parseJsonArraySafe(row.attachments),
    tags: parseJsonArraySafe(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };

  res.json({ success: true, data: contribution });
}));

// Create new contribution
router.post('/', requireUser, createContributionValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🔍 Create Contribution Request Body:', req.body);
  console.log('🔍 Create Contribution Status:', req.body.status);
  console.log('🔍 Create Contribution Tags:', req.body.tags, 'Type:', typeof req.body.tags);
  console.log('🔍 Create Contribution estimatedImpactValue:', req.body.estimatedImpactValue, 'Type:', typeof req.body.estimatedImpactValue);
  console.log('🔍 Create Contribution - Full Request:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    console.log('❌ Validation error details:', JSON.stringify(errors.array(), null, 2));
    throw createError(`Validation failed: ${errorMessages}`, 400);
  }
  
  console.log('✅ Validation passed, status:', req.body.status);

  const contributionData: CreateContributionRequest = req.body;
  console.log('🔍 ContributionData after assignment:', contributionData);
  console.log('🔍 ContributionData.status:', contributionData.status);
  
  // Process tags - convert string to array if needed
  if (typeof contributionData.tags === 'string') {
    contributionData.tags = (contributionData.tags as string).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  } else if (!Array.isArray(contributionData.tags)) {
    contributionData.tags = [];
  }
  
  // Ensure estimatedImpactValue is a number
  if (contributionData.estimatedImpactValue === undefined || contributionData.estimatedImpactValue === null) {
    contributionData.estimatedImpactValue = 0;
  } else if (typeof contributionData.estimatedImpactValue === 'string') {
    contributionData.estimatedImpactValue = Number(contributionData.estimatedImpactValue);
  }
  
  const userId = req.user!.id;

  // Validate contribution month format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(contributionData.contributionMonth)) {
    throw createError('Invalid contribution month format. Use YYYY-MM', 400);
  }

  // Debug user data
  console.log('🔍 Create Contribution - User Data from token:', {
    userId: req.user!.id,
    involvedAccountNames: req.user!.involvedAccountNames,
    involvedSaleNames: req.user!.involvedSaleNames,
    involvedSaleEmails: req.user!.involvedSaleEmails
  });
  console.log('🔍 Create Contribution - Request Data:', contributionData);

  // Use fresh user data from auth middleware (already fetched from database)
  console.log('🔍 Using fresh user data from auth middleware:', {
    userId: req.user!.id,
    involvedAccountNames: req.user!.involvedAccountNames,
    involvedSaleNames: req.user!.involvedSaleNames,
    involvedSaleEmails: req.user!.involvedSaleEmails,
    updatedAt: req.user!.updatedAt
  });

  // Validate that account and sale are in user's allowed list using fresh data
  const userAccountNames = req.user!.involvedAccountNames || [];
  const userSaleNames = req.user!.involvedSaleNames || [];
  const userSaleEmails = req.user!.involvedSaleEmails || [];
  
  console.log('🔍 User validation data:', {
    accountNames: userAccountNames,
    saleNames: userSaleNames,
    saleEmails: userSaleEmails,
    requestedAccount: contributionData.accountName,
    requestedSale: contributionData.saleName,
    requestedSaleEmail: contributionData.saleEmail
  });
  
  if (userAccountNames.length > 0 && !userAccountNames.includes(contributionData.accountName.trim())) {
    console.log('❌ Account validation failed:', {
      userAccounts: userAccountNames,
      requestedAccount: contributionData.accountName,
      requestedAccountTrimmed: contributionData.accountName.trim(),
      accountMatch: userAccountNames.includes(contributionData.accountName.trim())
    });
    throw createError(`Account "${contributionData.accountName}" not in your allowed list. Available accounts: ${userAccountNames.join(', ')}`, 400);
  }

  if (userSaleNames.length > 0 && !userSaleNames.includes(contributionData.saleName.trim())) {
    console.log('❌ Sale validation failed:', {
      userSales: userSaleNames,
      requestedSale: contributionData.saleName,
      requestedSaleTrimmed: contributionData.saleName.trim(),
      saleMatch: userSaleNames.includes(contributionData.saleName.trim())
    });
    throw createError('Sale not in your allowed list', 400);
  }
  
  // Validate sale email if provided
  if (userSaleEmails.length > 0 && !userSaleEmails.includes(contributionData.saleEmail.trim())) {
    console.log('❌ Sale email validation failed:', {
      userSaleEmails: userSaleEmails,
      requestedSaleEmail: contributionData.saleEmail,
      requestedSaleEmailTrimmed: contributionData.saleEmail.trim()
    });
    throw createError('Sale email not in your allowed list', 400);
  }

  const contributionId = uuidv4();
  const finalStatus = contributionData.status === 'draft' ? 'draft' : 'submitted';
  
  console.log('🔍 Create Contribution - Status Debug:', {
    receivedStatus: contributionData.status,
    finalStatus: finalStatus,
    isDraft: contributionData.status === 'draft',
    fullContributionData: contributionData
  });
  
  await dbExecute(`
    INSERT INTO contributions (
      id, userId, accountName, saleName, saleEmail, contributionType, 
      title, description, impact, effort, estimatedImpactValue, contributionMonth, 
      status, tags, attachments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    contributionId,
    userId,
    contributionData.accountName,
    contributionData.saleName,
    contributionData.saleEmail,
    contributionData.contributionType,
    contributionData.title,
    contributionData.description,
    contributionData.impact,
    contributionData.effort,
    contributionData.estimatedImpactValue || 0,
    contributionData.contributionMonth,
    finalStatus,
    JSON.stringify(contributionData.tags),
    JSON.stringify([])
  ]);

  res.status(201).json({ success: true, message: 'Contribution created successfully', data: { id: contributionId } });
}));

// Add error handler for contribution creation
router.use((error: any, req: AuthRequest, res: Response, next: any) => {
  console.error('❌ Contribution creation error:', error);
  console.error('❌ Error details:', {
    message: error.message,
    status: error.status,
    stack: error.stack
  });
  
  if (res.headersSent) {
    return next(error);
  }
  
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    message: message,
    error: error
  });
});

// Update contribution
router.put('/:id', requireUser, updateContributionValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData: UpdateContributionRequest = req.body;
  const userId = req.user!.id;

  // Check if contribution exists and user can edit it
  const row = await dbQueryOne('SELECT * FROM contributions WHERE id = ?', [id]);
  if (!row) throw createError('Contribution not found', 404);
  if (req.user!.role !== 'admin' && row.userId !== userId) throw createError('Access denied', 403);

    // Validate contribution month format if being updated
    if (updateData.contributionMonth && !/^\d{4}-\d{2}$/.test(updateData.contributionMonth)) {
      throw createError('Invalid contribution month format. Use YYYY-MM', 400);
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updateData.accountName !== undefined) {
      updateFields.push('accountName = ?');
      updateValues.push(updateData.accountName);
    }

    if (updateData.saleName !== undefined) {
      updateFields.push('saleName = ?');
      updateValues.push(updateData.saleName);
    }

    if (updateData.saleEmail !== undefined) {
      updateFields.push('saleEmail = ?');
      updateValues.push(updateData.saleEmail);
    }

    if (updateData.contributionType !== undefined) {
      updateFields.push('contributionType = ?');
      updateValues.push(updateData.contributionType);
    }

    if (updateData.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updateData.description);
    }

    if (updateData.impact !== undefined) {
      updateFields.push('impact = ?');
      updateValues.push(updateData.impact);
    }

    if (updateData.effort !== undefined) {
      updateFields.push('effort = ?');
      updateValues.push(updateData.effort);
    }

    if (updateData.contributionMonth !== undefined) {
      updateFields.push('contributionMonth = ?');
      updateValues.push(updateData.contributionMonth);
    }

    if (updateData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updateData.status);
    }

    if (updateData.tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(updateData.tags));
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE contributions SET ${updateFields.join(', ')} WHERE id = ?`;
    await dbExecute(updateQuery, updateValues);
    res.json({ success: true, message: 'Contribution updated successfully' });
}));

// Delete contribution
router.delete('/:id', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if contribution exists and user can delete it
  const row = await dbQueryOne('SELECT * FROM contributions WHERE id = ?', [id]);
  if (!row) throw createError('Contribution not found', 404);
  if (req.user!.role !== 'admin' && row.userId !== userId) throw createError('Access denied', 403);
  if (row.status !== 'draft' && req.user!.role !== 'admin') throw createError('Only draft contributions can be deleted', 400);
  await dbExecute('DELETE FROM contributions WHERE id = ?', [id]);
  res.json({ success: true, message: 'Contribution deleted successfully' });
}));

// Submit contribution for approval
router.post('/:id/submit', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if contribution exists and user can submit it
  const row = await dbQueryOne('SELECT * FROM contributions WHERE id = ?', [id]);
  if (!row) throw createError('Contribution not found', 404);
  if (req.user!.role !== 'admin' && row.userId !== userId) throw createError('Access denied', 403);
  if (row.status !== 'draft') throw createError('Only draft contributions can be submitted', 400);
  await dbExecute('UPDATE contributions SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['submitted', id]);
  res.json({ success: true, message: 'Contribution submitted successfully' });
}));

export { router as contributionRoutes };
