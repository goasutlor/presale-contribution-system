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

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: postgresUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SQLite connection
const sqliteDb = new sqlite3.Database(sqlitePath);

async function migrateUsers() {
  console.log('👥 Migrating users...');
  
  return new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM users', async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      if (rows.length === 0) {
        console.log('⚠️  No users found in SQLite database');
        resolve();
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
    sqliteDb.all('SELECT * FROM contributions', async (err, rows) => {
      if (err) {
        reject(err);
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
    // Test PostgreSQL connection
    const client = await pgPool.connect();
    console.log('✅ Connected to PostgreSQL');
    client.release();

    // Check if SQLite database exists
    if (!fs.existsSync(sqlitePath)) {
      console.log('⚠️  SQLite database not found, skipping migration');
      console.log('📝 Creating admin user in PostgreSQL...');
      
      const bcrypt = require('bcrypt');
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
