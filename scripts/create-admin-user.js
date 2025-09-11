const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../dist/data/presale_contributions.db');

console.log('🔍 Database path:', dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Create admin user
async function createAdminUser() {
  try {
    // Check if admin user already exists
    db.get('SELECT id FROM users WHERE email = ?', ['admin@presale.com'], async (err, row) => {
      if (err) {
        console.error('❌ Error checking admin user:', err);
        process.exit(1);
      }

      if (row) {
        console.log('✅ Admin user already exists');
        db.close();
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('password', 10);
      
      // Create admin user
      const adminUser = {
        id: 'admin-001',
        fullName: 'System Administrator',
        staffId: 'ADMIN001',
        email: 'admin@presale.com',
        password: hashedPassword,
        involvedAccountNames: JSON.stringify(['System']),
        involvedSaleNames: JSON.stringify(['Admin']),
        involvedSaleEmails: JSON.stringify(['admin@presale.com']),
        role: 'admin',
        status: 'approved',
        canViewOthers: true
      };

      db.run(`
        INSERT INTO users (
          id, fullName, staffId, email, password, 
          involvedAccountNames, involvedSaleNames, involvedSaleEmails,
          role, status, canViewOthers, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        adminUser.id,
        adminUser.fullName,
        adminUser.staffId,
        adminUser.email,
        adminUser.password,
        adminUser.involvedAccountNames,
        adminUser.involvedSaleNames,
        adminUser.involvedSaleEmails,
        adminUser.role,
        adminUser.status,
        adminUser.canViewOthers
      ], function(err) {
        if (err) {
          console.error('❌ Error creating admin user:', err);
          process.exit(1);
        }
        
        console.log('✅ Admin user created successfully');
        console.log('📧 Email: admin@presale.com');
        console.log('🔑 Password: password');
        console.log('👤 User ID:', this.lastID);
        
        db.close();
      });
    });
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
