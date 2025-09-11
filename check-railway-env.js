// Check Railway Environment Variables
console.log('🔍 Railway Environment Check');
console.log('========================');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

if (process.env.DATABASE_URL) {
  console.log('Database URL format:', process.env.DATABASE_URL.startsWith('postgresql://') ? '✅ PostgreSQL' : '❌ Not PostgreSQL');
} else {
  console.log('❌ DATABASE_URL is not set - PostgreSQL service not connected');
  console.log('📋 Please add PostgreSQL service to your Railway project');
}
