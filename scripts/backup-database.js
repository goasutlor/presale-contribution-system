const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../dist/data/presale_contributions.db');
const backupDir = path.join(__dirname, '../backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Create backup
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `presale_contributions_${timestamp}.db`);
  
  console.log('📊 Creating database backup...');
  console.log('🔍 Source:', dbPath);
  console.log('🔍 Backup:', backupPath);
  
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ Backup created successfully');
    console.log('📁 Backup file:', backupPath);
  } else {
    console.log('⚠️  Database file not found, creating empty backup');
    fs.writeFileSync(backupPath, '');
  }
}

// List backups
function listBackups() {
  console.log('📁 Available backups:');
  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.db'))
    .sort()
    .reverse();
  
  files.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    console.log(`${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
  });
}

// Restore from backup
function restoreBackup(backupFile) {
  const backupPath = path.join(backupDir, backupFile);
  
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found:', backupPath);
    return;
  }
  
  console.log('🔄 Restoring database from backup...');
  console.log('🔍 Backup:', backupPath);
  console.log('🔍 Target:', dbPath);
  
  // Ensure target directory exists
  const targetDir = path.dirname(dbPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.copyFileSync(backupPath, dbPath);
  console.log('✅ Database restored successfully');
}

// Main function
const command = process.argv[2];
const backupFile = process.argv[3];

switch (command) {
  case 'create':
    createBackup();
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
    restoreBackup(backupFile);
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
