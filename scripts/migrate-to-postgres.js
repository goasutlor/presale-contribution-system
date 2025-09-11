const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database paths
const sqlitePath = process.env.DB_PATH || path.join(__dirname, '../dist/data/presale_contributions.db');
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔄 Starting migration from SQLite to PostgreSQL...');
console.log('📁 SQLite path:', sqlitePath);
console.log('🔗 PostgreSQL URL:', postgresUrl.replace(/\/\/.*@/, '//***:***@'));

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('- DATABASE_URL length:', postgresUrl ? postgresUrl.length : 0);

// Parse DATABASE_URL for debugging
try {
  const url = new URL(postgresUrl);
  console.log('🔍 Database URL Details:');
  console.log('- Protocol:', url.protocol);
  console.log('- Host:', url.hostname);
  console.log('- Port:', url.port);
  console.log('- Database:', url.pathname.substring(1));
  console.log('- Username:', url.username);
  console.log('- Password:', url.password ? '***' : 'Not set');
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', error.message);
  process.exit(1);
}

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: postgresUrl,
  ssl: false, // Railway internal network doesn't need SSL
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000,
});

// Test connection first
async function testConnection() {
  try {
    console.log('🔄 Testing PostgreSQL connection...');
    const client = await pgPool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);
    
    // Test database name
    const dbResult = await client.query('SELECT current_database()');
    console.log('📊 Current Database:', dbResult.rows[0].current_database);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Detail:', error.detail);
    console.error('Error Hint:', error.hint);
    return false;
  }
}

// SQLite connection
const sqliteDb = new sqlite3.Database(sqlitePath);

// Create default users function
async function createDefaultUsers() {
  console.log('👤 Creating default users in PostgreSQL...');
  
  try {
    const client = await pgPool.connect();
    
    // Create default admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, status, canViewOthers, createdAt, updatedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO NOTHING
    `, [
      'Admin User',
      'ADMIN001',
      'admin@company.com',
      adminPassword,
      JSON.stringify(['G-Able Account']),
      JSON.stringify(['Sales Team A']),
      JSON.stringify(['sales@g-able.com']),
      'admin',
      'active',
      true,
      new Date(),
      new Date()
    ]);
    
    console.log('✅ Created default admin user (admin@company.com / admin123)');
    
    // Create default regular user
    const userPassword = await bcrypt.hash('user123', 10);
    
    await client.query(`
      INSERT INTO users (fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, status, canViewOthers, createdAt, updatedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO NOTHING
    `, [
      'Regular User',
      'USER001',
      'user@company.com',
      userPassword,
      JSON.stringify(['Client Account']),
      JSON.stringify(['Sales Team B']),
      JSON.stringify(['client@g-able.com']),
      'user',
      'active',
      false,
      new Date(),
      new Date()
    ]);
    
    console.log('✅ Created default regular user (user@company.com / user123)');
    
    client.release();
  } catch (error) {
    console.error('❌ Error creating default users:', error);
    throw error;
  }
}

async function migrateUsers() {
  console.log('👥 Migrating users...');
  
  return new Promise((resolve, reject) => {
    // Check if SQLite file exists
    if (!fs.existsSync(sqlitePath)) {
      console.log('⚠️  SQLite database not found, creating default users in PostgreSQL');
      createDefaultUsers().then(resolve).catch(reject);
      return;
    }
    
    sqliteDb.all('SELECT * FROM users', async (err, rows) => {
      if (err) {
        console.log('⚠️  Error reading SQLite database, creating default users in PostgreSQL');
        createDefaultUsers().then(resolve).catch(reject);
        return;
      }

      if (rows.length === 0) {
        console.log('⚠️  No users found in SQLite database, creating default users');
        createDefaultUsers().then(resolve).catch(reject);
        return;
      }

      try {
        const client = await pgPool.connect();
        
        for (const user of rows) {
          await client.query(`
            INSERT INTO users (id, fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, status, canViewOthers, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (email) DO NOTHING
          `, [
            user.id,
            user.fullName,
            user.staffId,
            user.email,
            user.password,
            user.involvedAccountNames,
            user.involvedSaleNames,
            user.involvedSaleEmails,
            user.role,
            user.status,
            user.canViewOthers,
            user.createdAt,
            user.updatedAt
          ]);
        }
        
        client.release();
        console.log(`✅ Migrated ${rows.length} users`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function migrateContributions() {
  console.log('📊 Migrating contributions...');
  
  return new Promise((resolve, reject) => {
    // Check if SQLite file exists
    if (!fs.existsSync(sqlitePath)) {
      console.log('⚠️  SQLite database not found, skipping contributions migration');
      resolve();
      return;
    }
    
    sqliteDb.all('SELECT * FROM contributions', async (err, rows) => {
      if (err) {
        console.log('⚠️  Error reading SQLite contributions, skipping migration');
        resolve();
        return;
      }

      if (rows.length === 0) {
        console.log('⚠️  No contributions found in SQLite database');
        resolve();
        return;
      }

      try {
        const client = await pgPool.connect();
        
        for (const contribution of rows) {
          await client.query(`
            INSERT INTO contributions (id, userId, accountName, saleName, saleEmail, contributionType, title, description, impact, effort, estimatedImpactValue, contributionMonth, status, tags, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO NOTHING
          `, [
            contribution.id,
            contribution.userId,
            contribution.accountName,
            contribution.saleName,
            contribution.saleEmail,
            contribution.contributionType,
            contribution.title,
            contribution.description,
            contribution.impact,
            contribution.effort,
            contribution.estimatedImpactValue,
            contribution.contributionMonth,
            contribution.status,
            contribution.tags,
            contribution.createdAt,
            contribution.updatedAt
          ]);
        }
        
        client.release();
        console.log(`✅ Migrated ${rows.length} contributions`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function migrate() {
  try {
    // Test PostgreSQL connection first
    console.log('🔄 Testing PostgreSQL connection before migration...');
    const connectionTest = await testConnection();
    if (!connectionTest) {
      console.error('❌ Cannot proceed with migration - PostgreSQL connection failed');
      process.exit(1);
    }

    // Check if SQLite database exists
    if (!fs.existsSync(sqlitePath)) {
      console.log('⚠️  SQLite database not found, skipping migration');
      console.log('📝 Creating admin user in PostgreSQL...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      const client = await pgPool.connect();
      await client.query(`
        INSERT INTO users (id, fullName, staffId, email, password, role, status, canViewOthers, involvedAccountNames, involvedSaleNames, involvedSaleEmails)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (email) DO NOTHING
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
      client.release();
      
      console.log('✅ Admin user created in PostgreSQL');
      return;
    }

    // Test SQLite connection
    sqliteDb.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err);
        process.exit(1);
      }
      console.log(`📊 SQLite database has ${row.count} users`);
    });

    // Migrate data
    await migrateUsers();
    await migrateContributions();
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

// Run migration
migrate();
