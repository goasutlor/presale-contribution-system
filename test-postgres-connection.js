// Test PostgreSQL Connection Script
const { Pool } = require('pg');

async function testPostgreSQLConnection() {
  console.log('🔍 Testing PostgreSQL Connection...');
  console.log('================================');
  
  // Debug environment variables
  console.log('Environment Variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  // Parse DATABASE_URL for debugging
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Database URL Details:');
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
  
  // Test connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.RAILWAY_ENVIRONMENT === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });
  
  try {
    console.log('🔄 Attempting to connect to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);
    
    // Test database name
    const dbResult = await client.query('SELECT current_database()');
    console.log('📊 Current Database:', dbResult.rows[0].current_database);
    
    // Test if we can create tables
    console.log('🔄 Testing table creation permissions...');
    await client.query('CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, test_field VARCHAR(50))');
    console.log('✅ Table creation test passed');
    
    // Clean up test table
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log('✅ Test table cleaned up');
    
    client.release();
    console.log('🎉 PostgreSQL connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Detail:', error.detail);
    console.error('Error Hint:', error.hint);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testPostgreSQLConnection();
