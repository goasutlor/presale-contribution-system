import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbQuery, dbQueryOne } from '../database/init';
import { authenticateToken, requireUser, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { ReportFilter, ReportData } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation for report filters
const reportFilterValidation = [
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('userId').optional().isString().withMessage('Valid user ID is required'),
  body('accountName').optional().isString().withMessage('Valid account name is required'),
  body('saleName').optional().isString().withMessage('Valid sale name is required'),
  body('contributionType').optional().isString().withMessage('Valid contribution type is required'),
  body('impact').optional().isString().withMessage('Valid impact level is required'),
  body('status').optional().isString().withMessage('Valid status is required')
];

// Get dashboard summary data
router.get('/dashboard', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const year = req.query.year ? parseInt(req.query.year as string) : 2025; // Default to 2025

  // Build base query based on user role
  let baseQuery = `
    SELECT 
      COUNT(*) as totalContributions,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvedContributions,
      COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submittedContributions,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draftContributions,
      COUNT(CASE WHEN impact = 'critical' THEN 1 END) as criticalImpact,
      COUNT(CASE WHEN impact = 'high' THEN 1 END) as highImpact,
      COUNT(CASE WHEN impact = 'medium' THEN 1 END) as mediumImpact,
      COUNT(CASE WHEN impact = 'low' THEN 1 END) as lowImpact
    FROM contributions
  `;

  const queryParams: any[] = [];
  const whereConditions: string[] = [];

  // Filter by year (use year field or extract from contributionMonth)
  whereConditions.push(`(year = ? OR (year IS NULL AND contributionMonth LIKE ?))`);
  queryParams.push(year, `${year}-%`);

  if (!isAdmin) {
    whereConditions.push('userId = ?');
    queryParams.push(userId);
  }

  if (whereConditions.length > 0) {
    baseQuery += ' WHERE ' + whereConditions.join(' AND ');
  }

  const row: any = await dbQueryOne(baseQuery, queryParams);
  const dashboardData = {
    totalContributions: row?.totalContributions || 0,
    approvedContributions: row?.approvedContributions || 0,
    submittedContributions: row?.submittedContributions || 0,
    draftContributions: row?.draftContributions || 0,
    impactBreakdown: {
      critical: row?.criticalImpact || 0,
      high: row?.highImpact || 0,
      medium: row?.mediumImpact || 0,
      low: row?.lowImpact || 0
    }
  };

  res.json({ success: true, data: dashboardData });
}));

// Get monthly timeline data for dashboard
router.get('/timeline', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const year = req.query.year ? parseInt(req.query.year as string) : 2025; // Default to 2025

  // Build base query based on user role
  let baseQuery = `
    SELECT 
      contributionMonth,
      impact,
      COUNT(*) as count
    FROM contributions
    WHERE (year = ? OR (year IS NULL AND contributionMonth LIKE ?))
  `;

  const queryParams: any[] = [year, `${year}-%`];

  if (!isAdmin) {
    baseQuery += ' AND userId = ?';
    queryParams.push(userId);
  }

  baseQuery += ' GROUP BY contributionMonth, impact ORDER BY contributionMonth';

  const rows: any[] = await dbQuery(baseQuery, queryParams);

  // Generate 12 months data
  const monthlyData: any[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    const monthData = {
      month: monthStr,
      monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'short' }),
      contributions: { low: 0, medium: 0, high: 0, critical: 0, total: 0 }
    };

    rows.forEach(row => {
      if (row.contributionMonth === monthStr) {
        const impact = row.impact as keyof typeof monthData.contributions;
        if (impact in monthData.contributions) {
          monthData.contributions[impact] = row.count;
          monthData.contributions.total += row.count;
        }
      }
    });

    monthlyData.push(monthData);
  }

  res.json({ success: true, data: { year: year, monthlyData } });
}));

// Get comprehensive report data
router.post('/comprehensive', requireUser, reportFilterValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const filters: ReportFilter = req.body;
  const userId = (req as AuthRequest).user!.id;
  const isAdmin = (req as AuthRequest).user!.role === 'admin';

  // Build WHERE clause based on filters
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (!isAdmin) { whereConditions.push('c.userId = ?'); queryParams.push(userId); }
  if (filters.startDate) { whereConditions.push('c.contributionMonth >= ?'); queryParams.push(filters.startDate); }
  if (filters.endDate) { whereConditions.push('c.contributionMonth <= ?'); queryParams.push(filters.endDate); }
  if (filters.userId && isAdmin) { whereConditions.push('c.userId = ?'); queryParams.push(filters.userId); }
  if (filters.accountName) { whereConditions.push('c.accountName LIKE ?'); queryParams.push(`%${filters.accountName}%`); }
  if (filters.saleName) { whereConditions.push('c.saleName LIKE ?'); queryParams.push(`%${filters.saleName}%`); }
  if (filters.contributionType) { whereConditions.push('c.contributionType = ?'); queryParams.push(filters.contributionType); }
  if (filters.impact) { whereConditions.push('c.impact = ?'); queryParams.push(filters.impact); }
  if (filters.status) { whereConditions.push('c.status = ?'); queryParams.push(filters.status); }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const contributionsQuery = `
    SELECT c.*, u.fullName as userName 
    FROM contributions c 
    JOIN users u ON c.userId = u.id 
    ${whereClause}
    ORDER BY c.createdAt DESC
  `;

  const rows: any[] = await dbQuery(contributionsQuery, queryParams);
  const contributions = rows.map(row => ({
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
    contributionMonth: row.contributionMonth,
    status: row.status,
    saleApproval: Boolean(row.saleApproval),
    saleApprovalDate: row.saleApprovalDate,
    saleApprovalNotes: row.saleApprovalNotes,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    tags: JSON.parse(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  const totalContributions = contributions.length;
  const totalUsers = new Set(contributions.map(c => c.userId)).size;
  const totalAccounts = new Set(contributions.map(c => c.accountName)).size;

  const contributionsByType: Record<string, number> = {};
  const contributionsByImpact: Record<string, number> = {};
  const contributionsByStatus: Record<string, number> = {};

  contributions.forEach(contribution => {
    contributionsByType[contribution.contributionType] = (contributionsByType[contribution.contributionType] || 0) + 1;
    contributionsByImpact[contribution.impact] = (contributionsByImpact[contribution.impact] || 0) + 1;
    contributionsByStatus[contribution.status] = (contributionsByStatus[contribution.status] || 0) + 1;
  });

  const userContributions: Record<string, number> = {};
  contributions.forEach(contribution => { userContributions[contribution.userId] = (userContributions[contribution.userId] || 0) + 1; });

  const topContributors = Object.entries(userContributions)
    .map(([userId, count]) => { const user = contributions.find(c => c.userId === userId); return { userId, fullName: user?.userName || 'Unknown', count }; })
    .sort((a, b) => b.count - a.count).slice(0, 10);

  const accountContributions: Record<string, number> = {};
  contributions.forEach(contribution => { accountContributions[contribution.accountName] = (accountContributions[contribution.accountName] || 0) + 1; });
  const topAccounts = Object.entries(accountContributions).map(([accountName, count]) => ({ accountName, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  const monthlyTrends: Record<string, number> = {};
  contributions.forEach(contribution => { const month = contribution.contributionMonth; monthlyTrends[month] = (monthlyTrends[month] || 0) + 1; });
  const monthlyTrendsArray = Object.entries(monthlyTrends).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));

  const reportData: ReportData = {
    totalContributions,
    totalUsers,
    totalAccounts,
    contributionsByType,
    contributionsByImpact,
    contributionsByStatus,
    topContributors,
    topAccounts,
    monthlyTrends: monthlyTrendsArray
  };

  res.json({ success: true, data: { summary: reportData, contributions } });
}));

// Get export data for printing
router.post('/export', requireUser, reportFilterValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const filters: ReportFilter = req.body;
  const userId = (req as AuthRequest).user!.id;
  const isAdmin = (req as AuthRequest).user!.role === 'admin';

  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (!isAdmin) { whereConditions.push('c.userId = ?'); queryParams.push(userId); }
  if (filters.startDate) { whereConditions.push('c.contributionMonth >= ?'); queryParams.push(filters.startDate); }
  if (filters.endDate) { whereConditions.push('c.contributionMonth <= ?'); queryParams.push(filters.endDate); }
  if (filters.userId && isAdmin) { whereConditions.push('c.userId = ?'); queryParams.push(filters.userId); }
  if (filters.accountName) { whereConditions.push('c.accountName LIKE ?'); queryParams.push(`%${filters.accountName}%`); }
  if (filters.saleName) { whereConditions.push('c.saleName LIKE ?'); queryParams.push(`%${filters.saleName}%`); }
  if (filters.contributionType) { whereConditions.push('c.contributionType = ?'); queryParams.push(filters.contributionType); }
  if (filters.impact) { whereConditions.push('c.impact = ?'); queryParams.push(filters.impact); }
  if (filters.status) { whereConditions.push('c.status = ?'); queryParams.push(filters.status); }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const exportQuery = `
    SELECT 
      u.fullName as 'Full Name',
      u.staffId as 'Staff ID',
      c.accountName as 'Account Name',
      c.saleName as 'Sale Name',
      c.saleEmail as 'Sale Email',
      c.contributionType as 'Contribution Type',
      c.title as 'Title',
      c.description as 'Description',
      c.impact as 'Impact',
      c.effort as 'Effort',
      c.contributionMonth as 'Contribution Month',
      c.status as 'Status',
      c.saleApproval as 'Sale Approval',
      c.saleApprovalDate as 'Approval Date',
      c.saleApprovalNotes as 'Approval Notes',
      c.tags as 'Tags',
      c.createdAt as 'Created Date',
      c.updatedAt as 'Updated Date'
    FROM contributions c 
    JOIN users u ON c.userId = u.id 
    ${whereClause}
    ORDER BY c.createdAt DESC
  `;

  const rows: any[] = await dbQuery(exportQuery, queryParams);
  const exportData = rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]').join(', '), saleApproval: row.saleApproval ? 'Yes' : 'No' }));
  res.json({ success: true, data: exportData, totalRecords: exportData.length, exportDate: new Date().toISOString() });
}));

// Get user-specific report
router.get('/user/:userId', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isAdmin && currentUserId !== userId) {
    throw createError('Access denied', 403);
  }

  const rows: any[] = await dbQuery(`
    SELECT 
      c.*, u.fullName as userName 
    FROM contributions c 
    JOIN users u ON c.userId = u.id 
    WHERE c.userId = ?
    ORDER BY c.createdAt DESC
  `, [userId]);

  const contributions = rows.map(row => ({
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
    contributionMonth: row.contributionMonth,
    status: row.status,
    saleApproval: Boolean(row.saleApproval),
    saleApprovalDate: row.saleApprovalDate,
    saleApprovalNotes: row.saleApprovalNotes,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    tags: JSON.parse(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  const totalContributions = contributions.length;
  const approvedContributions = contributions.filter(c => c.status === 'approved').length;
  const submittedContributions = contributions.filter(c => c.status === 'submitted').length;
  const draftContributions = contributions.filter(c => c.status === 'draft').length;

  const impactBreakdown = {
    critical: contributions.filter(c => c.impact === 'critical').length,
    high: contributions.filter(c => c.impact === 'high').length,
    medium: contributions.filter(c => c.impact === 'medium').length,
    low: contributions.filter(c => c.impact === 'low').length
  };

  const typeBreakdown = {
    technical: contributions.filter(c => c.contributionType === 'technical').length,
    business: contributions.filter(c => c.contributionType === 'business').length,
    relationship: contributions.filter(c => c.contributionType === 'relationship').length,
    innovation: contributions.filter(c => c.contributionType === 'innovation').length,
    other: contributions.filter(c => c.contributionType === 'other').length
  };

  res.json({ success: true, data: { contributions, summary: { totalContributions, approvedContributions, submittedContributions, draftContributions, impactBreakdown, typeBreakdown } } });
}));

export { router as reportRoutes };

// Export all data as JSON (admin only via requireUser + role check)
router.get('/export-data', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  const users = await dbQuery('SELECT * FROM users ORDER BY createdAt DESC');
  const contributions = await dbQuery('SELECT * FROM contributions ORDER BY createdAt DESC');

  const payload = {
    exportedAt: new Date().toISOString(),
    users,
    contributions
  };

  const json = JSON.stringify(payload, null, 2);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="asc3_export.json"');
  res.send(json);
}));
