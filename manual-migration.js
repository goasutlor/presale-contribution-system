// Manual Database Migration Script
const { Pool } = require('pg');

async function runMigration() {
  console.log('🚀 Starting manual database migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        staff_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        can_view_others BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');
    
    // Create contributions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contributions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL,
        year INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year)
      )
    `);
    console.log('✅ Created contributions table');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_contributions_month_year ON contributions(month, year)');
    console.log('✅ Created indexes');
    
    // Create default admin user
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', ['admin@company.com']);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (full_name, staff_id, email, password_hash, role, can_view_others)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['Admin User', 'ADMIN001', 'admin@company.com', hashedPassword, 'admin', true]);
      
      console.log('✅ Created default admin user');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    client.release();
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
