// Database initialization - supports both SQLite and PostgreSQL
import { User, Contribution } from '../types';

// Check if we should use PostgreSQL or SQLite
const usePostgreSQL = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

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