// Database initialization - supports both SQLite and PostgreSQL
import { User, Contribution } from '../types';

// Check if we should use PostgreSQL or SQLite
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';
const usePostgreSQL = hasDatabaseUrl && isProduction;

console.log('🔍 Database selection debug:', {
  hasDatabaseUrl,
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  isProduction,
  usePostgreSQL
});

let databaseModule: any;

if (usePostgreSQL) {
  console.log('🐘 Using PostgreSQL database');
  databaseModule = require('./postgres');
} else {
  console.log('🗃️ Using SQLite database');
  databaseModule = require('./sqlite');
}

export function getDatabase() {
  return databaseModule.getDatabase();
}

export async function initializeDatabase(): Promise<void> {
  return databaseModule.initializeDatabase();
}

// Re-export helper functions if they exist
export const dbQuery = databaseModule.dbQuery;
export const dbQueryOne = databaseModule.dbQueryOne;
export const dbExecute = databaseModule.dbExecute;

export function closeDatabase(): void {
  if (databaseModule.closeDatabase) {
    databaseModule.closeDatabase();
  }
}