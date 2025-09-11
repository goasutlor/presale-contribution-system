// Simple PostgreSQL Connection Test
const { Pool } = require('pg');

console.log('🔍 Simple PostgreSQL Connection Test');
console.log('====================================');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

// Try different connection methods
const connectionConfigs = [
  { name: 'No SSL', ssl: false },
  { name: 'SSL with rejectUnauthorized: false', ssl: { rejectUnauthorized: false } },
  { name: 'SSL with rejectUnauthorized: true', ssl: { rejectUnauthorized: true } }
];

async function testConnection(config) {
  console.log(`\n🔄 Testing ${config.name}...`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: config.ssl,
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });
  
  try {
    const client = await pool.connect();
    console.log(`✅ ${config.name} - Success!`);
    
    // Test basic query
    const result = await client.query('SELECT 1 as test');
    console.log(`✅ Query result:`, result.rows[0]);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error(`❌ ${config.name} - Failed:`, error.message);
    await pool.end();
    return false;
  }
}

async function runTests() {
  for (const config of connectionConfigs) {
    const success = await testConnection(config);
    if (success) {
      console.log(`\n🎉 Found working connection method: ${config.name}`);
      process.exit(0);
    }
  }
  
  console.log('\n❌ All connection methods failed');
  process.exit(1);
}

runTests();
