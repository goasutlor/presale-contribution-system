const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

// SQLite database path (local/dev). In production (Railway) we use PostgreSQL (DATABASE_URL).
const dbPath = process.env.DB_PATH || path.join(__dirname, '../dist/data/presale_contributions.db');
const backupDir = path.join(__dirname, '../backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function exportPostgres() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  const client = await pool.connect();
  try {
    // app_meta might not exist on older DBs
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )
    `);
    const users = (await client.query('SELECT * FROM users ORDER BY createdAt DESC')).rows;
    const contributions = (await client.query('SELECT * FROM contributions ORDER BY createdAt DESC')).rows;
    const complexProjects = (await client.query('SELECT * FROM complex_projects ORDER BY createdAt DESC')).rows;
    const appMeta = (await client.query('SELECT * FROM app_meta')).rows;
    return { users, contributions, complexProjects, appMeta };
  } finally {
    client.release();
    await pool.end();
  }
}

function exportSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`);
      const out = { users: [], contributions: [], complexProjects: [], appMeta: [] };
      db.all('SELECT * FROM users ORDER BY createdAt DESC', [], (e1, r1) => {
        if (e1) return reject(e1);
        out.users = r1 || [];
        db.all('SELECT * FROM contributions ORDER BY createdAt DESC', [], (e2, r2) => {
          if (e2) return reject(e2);
          out.contributions = r2 || [];
          db.all('SELECT * FROM complex_projects ORDER BY createdAt DESC', [], (e3, r3) => {
            if (e3) return reject(e3);
            out.complexProjects = r3 || [];
            db.all('SELECT * FROM app_meta', [], (e4, r4) => {
              if (e4) out.appMeta = [];
              else out.appMeta = r4 || [];
              db.close();
              resolve(out);
            });
          });
        });
      });
    });
  });
}

// Create backup (JSON for full system, plus .db file copy for SQLite when available)
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(backupDir, `asc3_export_${timestamp}.json`);

  console.log('📊 Creating FULL backup (JSON)...');

  const isPostgres = !!process.env.DATABASE_URL;
  let data;
  if (isPostgres) {
    console.log('🐘 Using PostgreSQL export');
    data = await exportPostgres();
  } else {
    console.log('🗃️ Using SQLite export');
    data = await exportSqlite();
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('✅ JSON backup created:', jsonPath);

  // Optional: copy raw SQLite file too (fast restore for local/dev)
  if (!isPostgres) {
    const dbBackupPath = path.join(backupDir, `presale_contributions_${timestamp}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dbBackupPath);
      console.log('✅ SQLite .db backup created:', dbBackupPath);
    } else {
      console.log('⚠️ SQLite database file not found, skip .db backup');
    }
  }
}

// List backups
function listBackups() {
  console.log('📁 Available backups:');
  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.db') || file.endsWith('.json'))
    .sort()
    .reverse();
  
  files.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    console.log(`${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
  });
}

async function restorePostgresFromJson(payload) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )
    `);
    await client.query('TRUNCATE TABLE contributions, complex_projects, app_meta, users RESTART IDENTITY CASCADE');

    const insertMany = async (table, rows, columns) => {
      for (const row of rows) {
        const cols = columns.filter((c) => row[c] !== undefined);
        if (cols.length === 0) continue;
        const values = cols.map((c) => row[c]);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
        await client.query(sql, values);
      }
    };

    await insertMany('users', payload.users || [], [
      'id','fullName','staffId','email','password','involvedAccountNames','involvedSaleNames','involvedSaleEmails','blogLinks',
      'role','status','canViewOthers','createdAt','updatedAt'
    ]);
    await insertMany('contributions', payload.contributions || [], [
      'id','userId','accountName','saleName','saleEmail','contributionType','title','description','impact','effort',
      'estimatedImpactValue','contributionMonth','year','status','tags','attachments','saleApproval','saleApprovalDate','saleApprovalNotes',
      'createdAt','updatedAt'
    ]);
    await insertMany('complex_projects', payload.complexProjects || [], [
      'id','userId','projectName','description','salesName','accountName','status','keySuccessFactors','reasonsForLoss',
      'lessonsLearned','suggestionsForImprovement','year','createdAt','updatedAt'
    ]);
    await insertMany('app_meta', payload.appMeta || [], ['key','value']);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

async function restoreSqliteFromJson(payload) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run('BEGIN');
      db.run(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`);
      db.run('DELETE FROM contributions');
      db.run('DELETE FROM complex_projects');
      db.run('DELETE FROM app_meta');
      db.run('DELETE FROM users');

      const insert = (table, row, cols) => {
        const columns = cols.filter((c) => row[c] !== undefined);
        if (columns.length === 0) return;
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const values = columns.map((c) => row[c]);
        db.run(sql, values);
      };

      (payload.users || []).forEach((u) => insert('users', u, [
        'id','fullName','staffId','email','password','involvedAccountNames','involvedSaleNames','involvedSaleEmails','blogLinks',
        'role','status','canViewOthers','createdAt','updatedAt'
      ]));
      (payload.contributions || []).forEach((c) => insert('contributions', c, [
        'id','userId','accountName','saleName','saleEmail','contributionType','title','description','impact','effort',
        'estimatedImpactValue','contributionMonth','year','status','tags','createdAt','updatedAt'
      ]));
      (payload.complexProjects || []).forEach((p) => insert('complex_projects', p, [
        'id','userId','projectName','description','salesName','accountName','status','keySuccessFactors','reasonsForLoss',
        'lessonsLearned','suggestionsForImprovement','year','createdAt','updatedAt'
      ]));
      (payload.appMeta || []).forEach((m) => insert('app_meta', m, ['key','value']));

      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK', () => {
            db.close();
            reject(err);
          });
        } else {
          db.close();
          resolve();
        }
      });
    });
  });
}

// Restore from backup (accepts .db for SQLite, or .json for full-system restore)
async function restoreBackup(backupFile) {
  const backupPath = path.join(backupDir, backupFile);
  
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found:', backupPath);
    return;
  }
  
  console.log('🔄 Restoring database from backup...');
  console.log('🔍 Backup:', backupPath);
  console.log('🔍 Target:', dbPath);

  const isJson = backupFile.endsWith('.json');
  if (isJson) {
    const payload = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const isPostgres = !!process.env.DATABASE_URL;
    if (isPostgres) {
      console.log('🐘 Restoring into PostgreSQL...');
      await restorePostgresFromJson(payload);
    } else {
      console.log('🗃️ Restoring into SQLite...');
      // Ensure target directory exists
      const targetDir = path.dirname(dbPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      await restoreSqliteFromJson(payload);
    }
    console.log('✅ Restore from JSON completed');
    return;
  }

  // .db restore only supported for SQLite
  if (!!process.env.DATABASE_URL) {
    console.error('❌ .db restore is not supported for PostgreSQL. Use a .json backup file instead.');
    return;
  }

  // Ensure target directory exists
  const targetDir = path.dirname(dbPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(backupPath, dbPath);
  console.log('✅ SQLite database restored successfully');
}

// Main function
const command = process.argv[2];
const backupFile = process.argv[3];

switch (command) {
  case 'create':
    createBackup().catch((e) => {
      console.error('❌ Backup failed:', e);
      process.exit(1);
    });
    break;
  case 'list':
    listBackups();
    break;
  case 'restore':
    if (!backupFile) {
      console.error('❌ Please specify backup file name');
      console.log('Usage: node backup-database.js restore <backup-file>');
      process.exit(1);
    }
    restoreBackup(backupFile).catch((e) => {
      console.error('❌ Restore failed:', e);
      process.exit(1);
    });
    break;
  default:
    console.log('📊 Database Backup Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node backup-database.js create     - Create backup');
    console.log('  node backup-database.js list       - List backups');
    console.log('  node backup-database.js restore <file> - Restore from backup');
    break;
}
