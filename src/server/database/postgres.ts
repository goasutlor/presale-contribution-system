import { Pool, PoolClient } from 'pg';

let pool: Pool;

export function getDatabase(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false, // Railway internal network doesn't need SSL
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase();
  
  try {
    // Test connection
    const client = await db.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    // Create tables if they don't exist
    await createTables();
    console.log('✅ Tables created/verified');
    
    // Create admin user if not exists
    await createAdminUser();
    console.log('✅ Admin user created/verified');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('❌ Error details:', error);
    // Don't throw - let server continue
    console.log('⚠️  Continuing without database initialization');
  }
}

// Map of known lowercased column names to the camelCase names expected by the app
const COLUMN_NAME_MAP: Record<string, string> = {
  // users
  id: 'id',
  fullname: 'fullName',
  staffid: 'staffId',
  email: 'email',
  password: 'password',
  involvedaccountnames: 'involvedAccountNames',
  involvedsalenames: 'involvedSaleNames',
  involvedsaleemails: 'involvedSaleEmails',
  role: 'role',
  status: 'status',
  canviewothers: 'canViewOthers',
  createdat: 'createdAt',
  updatedat: 'updatedAt',

  // contributions
  userid: 'userId',
  accountname: 'accountName',
  salename: 'saleName',
  saleemail: 'saleEmail',
  contributiontype: 'contributionType',
  title: 'title',
  description: 'description',
  impact: 'impact',
  effort: 'effort',
  estimatedimpactvalue: 'estimatedImpactValue',
  contributionmonth: 'contributionMonth',
  tags: 'tags',
  attachments: 'attachments',
  saleapproval: 'saleApproval',
  saleapprovaldate: 'saleApprovalDate',
  saleapprovalnotes: 'saleApprovalNotes',

  // aliases used in JOINs
  username: 'userName',

  // aggregate aliases used in dashboard queries
  totalcontributions: 'totalContributions',
  approvedcontributions: 'approvedContributions',
  submittedcontributions: 'submittedContributions',
  draftcontributions: 'draftContributions',
  criticalimpact: 'criticalImpact',
  highimpact: 'highImpact',
  mediumimpact: 'mediumImpact',
  lowimpact: 'lowImpact',
};

function normalizeRowKeys<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase();
    const mapped = COLUMN_NAME_MAP[lower] || key;
    normalized[mapped] = (row as any)[key];
  }
  return normalized as T;
}

async function createTables(): Promise<void> {
  const db = getDatabase();
  
  // Users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      staffId VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      involvedAccountNames TEXT,
      involvedSaleNames TEXT,
      involvedSaleEmails TEXT,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      canViewOthers BOOLEAN DEFAULT false,
      createdAt TIMESTAMP DEFAULT NOW(),
      updatedAt TIMESTAMP DEFAULT NOW()
    )
  `);

  // Contributions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS contributions (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      accountName VARCHAR(255) NOT NULL,
      saleName VARCHAR(255) NOT NULL,
      saleEmail VARCHAR(255) NOT NULL,
      contributionType VARCHAR(100) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      impact VARCHAR(50) NOT NULL,
      effort VARCHAR(50) NOT NULL,
      estimatedImpactValue DECIMAL(15,2),
      contributionMonth VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      tags TEXT,
      attachments TEXT,
      saleApproval BOOLEAN DEFAULT false,
      saleApprovalDate TIMESTAMP,
      saleApprovalNotes TEXT,
      createdAt TIMESTAMP DEFAULT NOW(),
      updatedAt TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Ensure columns exist for previously created tables
  await db.query(`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS attachments TEXT`);
  await db.query(`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS saleApproval BOOLEAN DEFAULT false`);
  await db.query(`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS saleApprovalDate TIMESTAMP`);
  await db.query(`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS saleApprovalNotes TEXT`);

  console.log('✅ Database tables created/verified');
}

async function createAdminUser(): Promise<void> {
  const db = getDatabase();
  const bcrypt = require('bcryptjs');
  
  try {
    // Check if admin user exists
    const result = await db.query('SELECT id FROM users WHERE email = $1', ['admin@presale.com']);
    
    if (result.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await db.query(`
        INSERT INTO users (id, fullName, staffId, email, password, role, status, canViewOthers, involvedAccountNames, involvedSaleNames, involvedSaleEmails)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        'admin-001',
        'System Administrator',
        'ADMIN001',
        'admin@presale.com',
        hashedPassword,
        'admin',
        'approved',
        true,
        JSON.stringify(['System']),
        JSON.stringify(['Admin']),
        JSON.stringify(['admin@presale.com'])
      ]);
      
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Helper function to convert SQLite-style queries to PostgreSQL
export function convertQuery(query: string, params: any[] = []): { query: string; params: any[] } {
  let paramIndex = 1;
  const convertedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
  return { query: convertedQuery, params };
}

// Helper function for database operations
export async function dbQuery(query: string, params: any[] = []): Promise<any> {
  const db = getDatabase();
  const { query: convertedQuery, params: convertedParams } = convertQuery(query, params);
  
  try {
    const result = await db.query(convertedQuery, convertedParams);
    return result.rows.map(normalizeRowKeys);
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
}

// Helper function for single row queries
export async function dbQueryOne(query: string, params: any[] = []): Promise<any> {
  const rows = await dbQuery(query, params);
  return rows[0] || null;
}

// Helper function for insert/update operations
export async function dbExecute(query: string, params: any[] = []): Promise<any> {
  const db = getDatabase();
  const { query: convertedQuery, params: convertedParams } = convertQuery(query, params);
  
  try {
    const result = await db.query(convertedQuery, convertedParams);
    return result;
  } catch (error) {
    console.error('❌ Database execute error:', error);
    throw error;
  }
}
