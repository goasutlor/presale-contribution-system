import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbExecute, dbQuery, dbQueryOne } from '../database/init';
import { authenticateToken, requireUser, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { ReportFilter, ReportData } from '../types';
import { getDatabase as getPgDatabase, convertQuery } from '../database/postgres';
import { getDatabase as getSqliteDatabase } from '../database/sqlite';

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
  const year = req.query.year ? parseInt(req.query.year as string) : 2026; // Default to 2026 (new year)

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

  // Year filtering: use contributionMonth as the source of truth (YYYY-MM).
  // This prevents "year column drift" (e.g., year=2026 but contributionMonth=2025-xx).
  // Expected behavior:
  // - year=2025 => show all current data
  // - year=2026 => show 0 until someone submits 2026-xx
  whereConditions.push(`contributionMonth LIKE ?`);
  queryParams.push(`${year}-%`);

  if (!isAdmin) {
    whereConditions.push('userId = ?');
    queryParams.push(userId);
  }

  if (whereConditions.length > 0) {
    baseQuery += ' WHERE ' + whereConditions.join(' AND ');
  }

  // Get total accounts count
  let accountsQuery = `
    SELECT COUNT(DISTINCT accountName) as totalAccounts
    FROM contributions
  `;
  const accountsParams: any[] = [];
  const accountsWhereConditions: string[] = [];
  
  accountsWhereConditions.push(`contributionMonth LIKE ?`);
  accountsParams.push(`${year}-%`);
  
  if (!isAdmin) {
    accountsWhereConditions.push('userId = ?');
    accountsParams.push(userId);
  }
  
  if (accountsWhereConditions.length > 0) {
    accountsQuery += ' WHERE ' + accountsWhereConditions.join(' AND ');
  }
  
  const accountsRow: any = await dbQueryOne(accountsQuery, accountsParams);
  // In PostgreSQL, aliases are often lowercased (totalaccounts) unless quoted.
  const totalAccounts = accountsRow?.totalAccounts ?? accountsRow?.totalaccounts ?? 0;

  console.log('🔍 Dashboard query for year', year, ':', baseQuery);
  console.log('🔍 Dashboard query params:', queryParams);
  const row: any = await dbQueryOne(baseQuery, queryParams);
  console.log('🔍 Dashboard query result for year', year, ':', row);
  console.log('🔍 Total contributions found:', row?.totalContributions || 0);
  
  const dashboardData = {
    totalContributions: row?.totalContributions || 0,
    approvedContributions: row?.approvedContributions || 0,
    submittedContributions: row?.submittedContributions || 0,
    draftContributions: row?.draftContributions || 0,
    totalAccounts: totalAccounts,
    impactBreakdown: {
      critical: row?.criticalImpact || 0,
      high: row?.highImpact || 0,
      medium: row?.mediumImpact || 0,
      low: row?.lowImpact || 0
    }
  };

  console.log('🔍 Dashboard data for year', year, ':', dashboardData);
  res.json({ success: true, data: dashboardData });
}));

// Get monthly timeline data for dashboard
router.get('/timeline', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const year = req.query.year ? parseInt(req.query.year as string) : 2026; // Default to 2026 (new year)

  // Build base query based on user role
  let baseQuery = `
    SELECT 
      contributionMonth,
      impact,
      COUNT(*) as count
    FROM contributions
    WHERE contributionMonth LIKE ?
  `;

  const queryParams: any[] = [`${year}-%`];

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

// ===========================
// Full System Export / Restore
// ===========================

// Export all system data as JSON (admin only)
router.get('/export-data', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  // Ensure app_meta exists (created by migrations, but keep safe here)
  try {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  } catch {
    // Ignore if dialect doesn't support this exact statement; table likely exists already
  }

  const users = await dbQuery('SELECT * FROM users ORDER BY createdAt DESC');
  const contributions = await dbQuery('SELECT * FROM contributions ORDER BY createdAt DESC');
  const complexProjects = await dbQuery('SELECT * FROM complex_projects ORDER BY createdAt DESC');

  let appMeta: any[] = [];
  try {
    appMeta = await dbQuery('SELECT * FROM app_meta');
  } catch {
    appMeta = [];
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    users,
    contributions,
    complexProjects,
    appMeta
  };

  const json = JSON.stringify(payload, null, 2);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="asc3_export.json"');
  res.send(json);
}));

// Restore all system data from JSON (admin only)
router.post('/restore-data', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    throw createError('Invalid payload', 400);
  }

  const users: any[] = Array.isArray(payload.users) ? payload.users : [];
  const contributions: any[] = Array.isArray(payload.contributions) ? payload.contributions : [];
  const complexProjects: any[] = Array.isArray(payload.complexProjects) ? payload.complexProjects : [];
  const appMeta: any[] = Array.isArray(payload.appMeta) ? payload.appMeta : [];

  const usePostgreSQL = !!process.env.DATABASE_URL;

  const nowIso = new Date().toISOString();

  if (usePostgreSQL) {
    const pool = getPgDatabase();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure app_meta exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_meta (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT
        )
      `);

      // Wipe data (order + CASCADE to satisfy FK constraints)
      await client.query('TRUNCATE TABLE contributions, complex_projects, app_meta, users RESTART IDENTITY CASCADE');

      const insertRow = async (table: string, row: Record<string, any>, columns: string[]) => {
        const cols = columns.filter((c) => row[c] !== undefined);
        const values = cols.map((c) => row[c]);
        if (cols.length === 0) return;
        const placeholders = cols.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
        const converted = convertQuery(sql, values);
        await client.query(converted.query, converted.params);
      };

      // Insert users first (FK parent)
      for (const u of users) {
        await insertRow('users', u, [
          'id','fullName','staffId','email','password','involvedAccountNames','involvedSaleNames','involvedSaleEmails','blogLinks',
          'role','status','canViewOthers','createdAt','updatedAt'
        ]);
      }

      // Insert contributions
      for (const c of contributions) {
        await insertRow('contributions', c, [
          'id','userId','accountName','saleName','saleEmail','contributionType','title','description','impact','effort',
          'estimatedImpactValue','contributionMonth','year','status','tags','attachments','saleApproval','saleApprovalDate','saleApprovalNotes',
          'createdAt','updatedAt'
        ]);
      }

      // Insert complex projects
      for (const p of complexProjects) {
        await insertRow('complex_projects', p, [
          'id','userId','projectName','description','salesName','accountName','status','keySuccessFactors','reasonsForLoss',
          'lessonsLearned','suggestionsForImprovement','year','createdAt','updatedAt'
        ]);
      }

      // Insert app meta
      for (const m of appMeta) {
        await insertRow('app_meta', m, ['key','value']);
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Restore completed', restoredAt: nowIso });
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw createError(`Restore failed: ${e?.message || 'unknown error'}`, 500);
    } finally {
      client.release();
    }
    return;
  }

  // SQLite restore
  const db = getSqliteDatabase();
  const run = (sql: string, params: any[] = []) =>
    new Promise<void>((resolve, reject) => {
      db.run(sql, params, (err) => (err ? reject(err) : resolve()));
    });

  try {
    await run('BEGIN');
    await run(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`);

    // Wipe data (child first)
    await run('DELETE FROM contributions');
    await run('DELETE FROM complex_projects');
    await run('DELETE FROM app_meta');
    await run('DELETE FROM users');

    const insertSqlite = async (table: string, row: Record<string, any>, columns: string[]) => {
      const cols = columns.filter((c) => row[c] !== undefined);
      const values = cols.map((c) => row[c]);
      if (cols.length === 0) return;
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      await run(sql, values);
    };

    for (const u of users) {
      await insertSqlite('users', u, [
        'id','fullName','staffId','email','password','involvedAccountNames','involvedSaleNames','involvedSaleEmails','blogLinks',
        'role','status','canViewOthers','createdAt','updatedAt'
      ]);
    }
    for (const c of contributions) {
      await insertSqlite('contributions', c, [
        'id','userId','accountName','saleName','saleEmail','contributionType','title','description','impact','effort',
        'estimatedImpactValue','contributionMonth','year','status','tags','createdAt','updatedAt'
      ]);
    }
    for (const p of complexProjects) {
      await insertSqlite('complex_projects', p, [
        'id','userId','projectName','description','salesName','accountName','status','keySuccessFactors','reasonsForLoss',
        'lessonsLearned','suggestionsForImprovement','year','createdAt','updatedAt'
      ]);
    }
    for (const m of appMeta) {
      await insertSqlite('app_meta', m, ['key','value']);
    }

    await run('COMMIT');
    res.json({ success: true, message: 'Restore completed', restoredAt: nowIso });
  } catch (e: any) {
    try { await run('ROLLBACK'); } catch {}
    throw createError(`Restore failed: ${e?.message || 'unknown error'}`, 500);
  }
}));

// ===========================
// Portfolio Report
// ===========================

// ===========================
// Portfolio Summary Report (All Users, Public Link stored in DB)
// ===========================

async function ensurePublicReportsTable() {
  try {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS public_reports (
        report_key TEXT PRIMARY KEY,
        report_type TEXT NOT NULL,
        year INTEGER NOT NULL,
        html TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  } catch {
    // Best-effort: table may already exist or dialect may handle differently.
  }
}

function safeParseJsonArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function generatePortfolioSummaryHTML(data: {
  year: number;
  users: Array<{ fullName: string; staffId: string; email: string; status?: string; blogLinks: string[] }>;
  baseUrl: string;
}): string {
  const { year, users, baseUrl } = data;
  const publicUrl = `${baseUrl}/portfolio-summary/${year}`;

  const effectiveUsers = users.map((u) => ({
    ...u,
    blogLinks: year === 2025 ? (u.blogLinks || []) : []
  }));

  const totalUsers = effectiveUsers.length;
  const usersWithLinks = effectiveUsers.filter((u) => (u.blogLinks || []).length > 0).length;
  const totalLinks = effectiveUsers.reduce((sum, u) => sum + (u.blogLinks || []).length, 0);

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const rowsHtml = effectiveUsers
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
    .map((u) => {
      const links = (u.blogLinks || []).slice(0, 50);
      const linksHtml =
        links.length > 0
          ? links
              .map(
                (link) => `
                <a class="link" href="${link}" target="_blank" rel="noopener noreferrer">
                  <span class="link-domain">${extractDomain(link)}</span>
                  <span class="link-url">${link}</span>
                </a>
              `
              )
              .join('')
          : `<span class="muted">—</span>`;

      return `
        <tr>
          <td>
            <div class="name">${u.fullName || '-'}</div>
            <div class="sub">${u.staffId || '-'} • ${u.email || '-'}</div>
          </td>
          <td class="center">
            <span class="badge">${u.status || 'unknown'}</span>
          </td>
          <td class="center mono">${(u.blogLinks || []).length}</td>
          <td class="links">${linksHtml}</td>
        </tr>
      `;
    })
    .join('');

  const generatedAt = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Portfolio Summary (ปี ${year})</title>
    <style>
      :root {
        --bg: #f3f4f6;
        --card: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --border: #e5e7eb;
        --primary: #2563eb;
        --primary-50: #eff6ff;
        --success-50: #ecfdf5;
        --success: #16a34a;
        --warning-50: #fffbeb;
        --warning: #b45309;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      .wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 32px 16px;
      }
      .header {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 20px 20px;
        box-shadow: 0 10px 24px rgba(0,0,0,0.06);
      }
      .title-row {
        display: flex;
        gap: 12px;
        align-items: baseline;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
      }
      .year-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--primary-50);
        color: var(--primary);
        font-weight: 600;
        font-size: 13px;
        border: 1px solid #dbeafe;
      }
      .subline {
        margin-top: 6px;
        color: var(--muted);
        font-size: 13px;
      }
      .stats {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .stat {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px;
        background: #fff;
      }
      .stat .k { color: var(--muted); font-size: 12px; }
      .stat .v { margin-top: 4px; font-size: 20px; font-weight: 700; }
      .notice {
        margin-top: 12px;
        border: 1px solid #fde68a;
        background: var(--warning-50);
        color: var(--warning);
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 13px;
        font-weight: 600;
      }
      .table-card {
        margin-top: 16px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 24px rgba(0,0,0,0.06);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      thead th {
        text-align: left;
        font-size: 12px;
        letter-spacing: .03em;
        text-transform: uppercase;
        color: var(--muted);
        background: #f9fafb;
        border-bottom: 1px solid var(--border);
        padding: 12px 14px;
      }
      tbody td {
        border-bottom: 1px solid var(--border);
        padding: 12px 14px;
        vertical-align: top;
        font-size: 13px;
      }
      tbody tr:hover td {
        background: #fbfdff;
      }
      .name { font-weight: 700; }
      .sub { color: var(--muted); margin-top: 3px; font-size: 12px; }
      .muted { color: var(--muted); }
      .center { text-align: center; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
      .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
        font-size: 12px;
        color: #374151;
      }
      .links {
        min-width: 360px;
      }
      .link {
        display: block;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: 10px;
        text-decoration: none;
        color: var(--text);
        background: #fff;
        margin-bottom: 8px;
      }
      .link:hover {
        border-color: #bfdbfe;
        box-shadow: 0 6px 14px rgba(37,99,235,0.10);
      }
      .link-domain {
        display: inline-block;
        font-weight: 700;
        color: var(--primary);
        background: var(--primary-50);
        border: 1px solid #dbeafe;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
      }
      .link-url {
        display: block;
        color: var(--muted);
        margin-top: 4px;
        font-size: 12px;
        word-break: break-all;
      }
      .footer {
        margin-top: 14px;
        color: var(--muted);
        font-size: 12px;
        text-align: center;
      }
      .public {
        margin-top: 10px;
        background: var(--success-50);
        border: 1px solid #bbf7d0;
        color: var(--success);
        padding: 10px 12px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
      }
      .public a {
        color: inherit;
        text-decoration: underline;
        word-break: break-all;
      }
      @media (max-width: 768px) {
        .stats { grid-template-columns: 1fr; }
        .links { min-width: auto; }
      }
      @media print {
        body { background: #fff; }
        .header, .table-card { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <div class="title-row">
          <h1>Portfolio Summary (All Users)</h1>
          <div class="year-pill">ปี ${year}</div>
        </div>
        <div class="subline">สรุป Blog Links / Portfolio ของทุกคน (ยกเว้น Admin) • Generated: ${generatedAt}</div>
        <div class="stats">
          <div class="stat"><div class="k">Total Users</div><div class="v">${totalUsers}</div></div>
          <div class="stat"><div class="k">Users With Links</div><div class="v">${usersWithLinks}</div></div>
          <div class="stat"><div class="k">Total Links</div><div class="v">${totalLinks}</div></div>
        </div>
        <div class="notice">⚠️ ลิงก์ทั้งหมดถูกนับเป็นของปี 2025 เท่านั้น • เลือกปี 2026 = 0</div>
        <div class="public">Public Link: <a href="${publicUrl}">${publicUrl}</a></div>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th style="width: 260px;">User</th>
              <th style="width: 120px;" class="center">Status</th>
              <th style="width: 120px;" class="center">Links</th>
              <th>Blog Links / Portfolio URLs</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="4" class="center muted" style="padding: 24px;">No users found</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="footer">This page is public and does not require login. Managed by Admin via Reports.</div>
    </div>
  </body>
</html>`;
}

// Generate Portfolio Summary HTML for all users (admin only). Also stores the HTML for public access.
router.get('/generate-portfolio-summary/:year', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  await ensurePublicReportsTable();

  const yearNum = parseInt(req.params.year);
  if (![2025, 2026].includes(yearNum)) {
    throw createError('Invalid year', 400);
  }

  const rows: any[] = await dbQuery(
    `SELECT id, fullName, staffId, email, status, role, blogLinks FROM users WHERE role != 'admin' ORDER BY fullName ASC`
  );

  const users = rows.map((r: any) => ({
    fullName: r.fullName,
    staffId: r.staffId,
    email: r.email,
    status: r.status,
    blogLinks: safeParseJsonArray(r.blogLinks).filter((x: any) => typeof x === 'string' && x.trim() !== '')
  }));

  const baseUrl = process.env.BASE_URL || (req.protocol + '://' + req.get('host'));
  const html = generatePortfolioSummaryHTML({ year: yearNum, users, baseUrl });

  const now = new Date().toISOString();
  const reportKey = `portfolio_summary_${yearNum}`;

  await dbExecute(
    `INSERT INTO public_reports (report_key, report_type, year, html, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(report_key) DO UPDATE SET
       html = excluded.html,
       created_by = excluded.created_by,
       updated_at = excluded.updated_at`,
    [reportKey, 'portfolio_summary', yearNum, html, req.user!.id, now, now]
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Portfolio_Summary_${yearNum}_${now.split('T')[0]}.html"`);
  res.send(html);
}));

// Status for Portfolio Summary public link (admin only)
router.get('/portfolio-summary/:year/status', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  await ensurePublicReportsTable();

  const yearNum = parseInt(req.params.year);
  if (![2025, 2026].includes(yearNum)) {
    throw createError('Invalid year', 400);
  }

  const reportKey = `portfolio_summary_${yearNum}`;
  const row = await dbQueryOne(`SELECT report_key as reportKey FROM public_reports WHERE report_key = ?`, [reportKey]);

  const baseUrl = process.env.BASE_URL || (req.protocol + '://' + req.get('host'));
  const publicUrl = `${baseUrl}/portfolio-summary/${yearNum}`;
  res.json({ success: true, data: { exists: !!row, publicUrl } });
}));

// Remove Portfolio Summary public link (admin only)
router.delete('/portfolio-summary/:year', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  await ensurePublicReportsTable();

  const yearNum = parseInt(req.params.year);
  if (![2025, 2026].includes(yearNum)) {
    throw createError('Invalid year', 400);
  }

  const reportKey = `portfolio_summary_${yearNum}`;
  await dbExecute(`DELETE FROM public_reports WHERE report_key = ?`, [reportKey]);
  res.json({ success: true, message: 'Portfolio Summary public link removed' });
}));

// Generate HTML Portfolio for a user (admin only)
router.get('/generate-portfolio/:userId/:year', requireUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  const { userId, year } = req.params;
  const yearNum = parseInt(year);

  // Get user data
  const userRow: any = await dbQueryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (!userRow) {
    throw createError('User not found', 404);
  }

  // Don't generate portfolio for admin users
  if (userRow.role === 'admin') {
    throw createError('Cannot generate portfolio for admin users', 400);
  }

  // Parse blogLinks
  const blogLinks = Array.isArray(userRow.blogLinks) 
    ? userRow.blogLinks 
    : (userRow.blogLinks ? JSON.parse(userRow.blogLinks) : []);

  // Generate HTML Portfolio
  const html = generatePortfolioHTML({
    user: {
      id: userRow.id,
      fullName: userRow.fullName,
      staffId: userRow.staffId,
      email: userRow.email,
      blogLinks: blogLinks
    },
    year: yearNum,
    baseUrl: process.env.BASE_URL || (req.protocol + '://' + req.get('host'))
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}));

// Helper function to generate HTML Portfolio (shared with index.ts public route)
export function generatePortfolioHTML(data: { user: any; year: number; baseUrl: string }): string {
  const { user, year, baseUrl } = data;
  const publicUrl = `${baseUrl}/portfolio/${user.id}/${year}`;
  
  // Extract domains from blog links
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const blogLinksHTML = user.blogLinks && user.blogLinks.length > 0
    ? user.blogLinks.map((link: string) => `
      <div class="blog-link-item">
        <svg class="link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
        </svg>
        <a href="${link}" target="_blank" rel="noopener noreferrer" class="blog-link">
          ${extractDomain(link)}
          <svg class="external-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      </div>
    `).join('')
    : '<p class="no-links">ยังไม่มี Blog Links</p>';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio - ${user.fullName} (${year})</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    .header .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .header .year {
      font-size: 1rem;
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.2);
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      margin-top: 1rem;
    }
    .content {
      padding: 3rem 2rem;
    }
    .user-info {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e5e7eb;
    }
    .user-info h2 {
      font-size: 1.8rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }
    .user-info .staff-id {
      color: #6b7280;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }
    .user-info .email {
      color: #9ca3af;
      font-size: 0.9rem;
    }
    .section {
      margin-bottom: 3rem;
    }
    .section-title {
      font-size: 1.5rem;
      color: #1f2937;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .section-title svg {
      width: 24px;
      height: 24px;
      color: #667eea;
    }
    .blog-links {
      display: grid;
      gap: 1rem;
    }
    .blog-link-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
    }
    .blog-link-item:hover {
      background: #f3f4f6;
      border-color: #667eea;
      transform: translateX(4px);
    }
    .link-icon {
      width: 20px;
      height: 20px;
      color: #667eea;
      flex-shrink: 0;
    }
    .blog-link {
      flex: 1;
      color: #1f2937;
      text-decoration: none;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .blog-link:hover {
      color: #667eea;
    }
    .external-icon {
      width: 16px;
      height: 16px;
      color: #9ca3af;
    }
    .no-links {
      text-align: center;
      color: #9ca3af;
      font-style: italic;
      padding: 2rem;
    }
    .footer {
      background: #f9fafb;
      padding: 2rem;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 0.9rem;
    }
    .footer .note {
      margin-top: 1rem;
      padding: 1rem;
      background: #fef3c7;
      border-radius: 8px;
      color: #92400e;
      font-size: 0.85rem;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
    }
    @media (max-width: 640px) {
      body {
        padding: 1rem;
      }
      .header {
        padding: 2rem 1.5rem;
      }
      .header h1 {
        font-size: 2rem;
      }
      .content {
        padding: 2rem 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Portfolio Summary</h1>
      <div class="subtitle">${user.fullName}</div>
      <div class="year">ปี ${year}</div>
    </div>
    <div class="content">
      <div class="user-info">
        <h2>${user.fullName}</h2>
        <div class="staff-id">Staff ID: ${user.staffId}</div>
        <div class="email">${user.email}</div>
      </div>
      <div class="section">
        <div class="section-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          <span>Blog Links & Portfolio</span>
        </div>
        <div class="blog-links">
          ${blogLinksHTML}
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div class="note">
        ⚠️ บทความทั้งหมดใน Portfolio นี้เป็นของปี 2025 ทั้งหมด
      </div>
      <p style="margin-top: 1rem;">
        <strong>Public Link:</strong><br>
        <a href="${publicUrl}" style="color: #667eea; word-break: break-all;">${publicUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export { router as reportRoutes };
