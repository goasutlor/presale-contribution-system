import sqlite3 from 'sqlite3';
import path from 'path';
import { User, Contribution } from '../types';

// Create data directory if it doesn't exist
import fs from 'fs';

const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../../../dist/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'presale_contributions.db');

export function getDatabase(): sqlite3.Database {
  const db = new sqlite3.Database(dbPath);
  // Enable foreign keys for every database connection
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        staffId TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        involvedAccountNames TEXT NOT NULL,
        involvedSaleNames TEXT NOT NULL,
        involvedSaleEmails TEXT NOT NULL,
        role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
        canViewOthers BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
      
      // Create contributions table after users table
      db.run(`
        CREATE TABLE IF NOT EXISTS contributions (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          accountName TEXT NOT NULL,
          saleName TEXT NOT NULL,
          saleEmail TEXT NOT NULL,
          contributionType TEXT CHECK(contributionType IN ('technical', 'business', 'relationship', 'innovation', 'other')) NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          impact TEXT CHECK(impact IN ('low', 'medium', 'high', 'critical')) NOT NULL,
          effort TEXT CHECK(effort IN ('low', 'medium', 'high')) NOT NULL,
          estimatedImpactValue INTEGER DEFAULT 0,
          contributionMonth TEXT NOT NULL,
          status TEXT DEFAULT 'submitted',
          attachments TEXT,
          tags TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating contributions table:', err);
          reject(err);
          return;
        }
        
        // Create indexes after tables are created
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(userId)
        `, (err) => {
          if (err) {
            console.error('Error creating index on userId:', err);
          }
        });

        db.run(`
          CREATE INDEX IF NOT EXISTS idx_contributions_account_name ON contributions(accountName)
        `, (err) => {
          if (err) {
            console.error('Error creating index on accountName:', err);
          }
        });

        db.run(`
          CREATE INDEX IF NOT EXISTS idx_contributions_sale_name ON contributions(saleName)
        `, (err) => {
          if (err) {
            console.error('Error creating index on saleName:', err);
          }
        });

        db.run(`
          CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status)
        `, (err) => {
          if (err) {
            console.error('Error creating index on status:', err);
          }
        });

        // Create default users if not exist
        db.get('SELECT id FROM users WHERE email = ?', ['admin@presale.com'], (err, adminRow) => {
          if (err) {
            console.error('Error checking admin user:', err);
            reject(err);
            return;
          }
          
          if (!adminRow) {
            // Create default admin user
            const adminUser: Partial<User> = {
              id: 'admin-001',
              fullName: 'System Administrator',
              staffId: 'ADMIN001',
              email: 'admin@presale.com',
              password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
              involvedAccountNames: ['All Accounts'],
              involvedSaleNames: ['All Sales'],
              involvedSaleEmails: ['admin@presale.com'],
              role: 'admin',
              canViewOthers: true
            };

            db.run(`
              INSERT INTO users (id, fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, canViewOthers)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              adminUser.id,
              adminUser.fullName,
              adminUser.staffId,
              adminUser.email,
              adminUser.password,
              JSON.stringify(adminUser.involvedAccountNames),
              JSON.stringify(adminUser.involvedSaleNames),
              JSON.stringify(adminUser.involvedSaleEmails),
              adminUser.role,
              adminUser.canViewOthers
            ], (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
                reject(err);
                return;
              }
              console.log('✅ Default admin user created');
              createRegularUser();
            });
          } else {
            console.log('✅ Admin user already exists');
            createRegularUser();
          }
        });

        const createRegularUser = () => {
          db.get('SELECT id FROM users WHERE email = ?', ['user@company.com'], (err, userRow) => {
            if (err) {
              console.error('Error checking regular user:', err);
              reject(err);
              return;
            }
            
            if (!userRow) {
              // Create default regular user
              const regularUser: Partial<User> = {
                id: 'user-001',
                fullName: 'Regular User',
                staffId: 'USER001',
                email: 'user@company.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
                involvedAccountNames: ['Account A', 'Account B'],
                involvedSaleNames: ['Sale Person A', 'Sale Person B'],
                involvedSaleEmails: ['sale1@company.com', 'sale2@company.com'],
                role: 'user',
                canViewOthers: false
              };

              db.run(`
                INSERT INTO users (id, fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, canViewOthers)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                regularUser.id,
                regularUser.fullName,
                regularUser.staffId,
                regularUser.email,
                regularUser.password,
                JSON.stringify(regularUser.involvedAccountNames),
                JSON.stringify(regularUser.involvedSaleNames),
                JSON.stringify(regularUser.involvedSaleEmails),
                regularUser.role,
                regularUser.canViewOthers
              ], (err) => {
                if (err) {
                  console.error('Error creating regular user:', err);
                  reject(err);
                  return;
                }
                console.log('✅ Default regular user created');
                createSontasUser();
              });
            } else {
              console.log('✅ Regular user already exists');
              createSontasUser();
            }
          });
        };

        const createSontasUser = () => {
          db.get('SELECT id FROM users WHERE email = ?', ['sontas.j@g-able.com'], (err, userRow) => {
            if (err) {
              console.error('Error checking sontas user:', err);
              reject(err);
              return;
            }
            
            if (!userRow) {
              // Create sontas user
              const sontasUser: Partial<User> = {
                id: 'user-002',
                fullName: 'Sontas J',
                staffId: 'SONTAS001',
                email: 'sontas.j@g-able.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
                involvedAccountNames: ['G-Able Account', 'Client Account'],
                involvedSaleNames: ['Sales Team A', 'Sales Team B'],
                involvedSaleEmails: ['sales@g-able.com', 'client@g-able.com'],
                role: 'user',
                canViewOthers: false
              };

              db.run(`
                INSERT INTO users (id, fullName, staffId, email, password, involvedAccountNames, involvedSaleNames, involvedSaleEmails, role, canViewOthers)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                sontasUser.id,
                sontasUser.fullName,
                sontasUser.staffId,
                sontasUser.email,
                sontasUser.password,
                JSON.stringify(sontasUser.involvedAccountNames),
                JSON.stringify(sontasUser.involvedSaleNames),
                JSON.stringify(sontasUser.involvedSaleEmails),
                sontasUser.role,
                sontasUser.canViewOthers
              ], (err) => {
                if (err) {
                  console.error('Error creating sontas user:', err);
                  reject(err);
                  return;
                }
                console.log('✅ Sontas user created');
                resolve();
              });
            } else {
              console.log('✅ Sontas user already exists');
              resolve();
            }
          });
        };
      });
    });
  });
}

export function closeDatabase(): void {
  const db = getDatabase();
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
  });
}
