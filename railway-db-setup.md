# 🗄️ Railway Database Setup Guide

## 📊 Railway Database Services

Railway มี database services หลายแบบ:
- **PostgreSQL** (แนะนำ)
- **MySQL**
- **MongoDB**
- **Redis**

## 🚀 Setup PostgreSQL Database

### 1. สร้าง Database Service
1. เข้า Railway Dashboard
2. เลือก Project ของเรา
3. คลิก **"+ New"**
4. เลือก **"Database"**
5. เลือก **"PostgreSQL"**

### 2. Environment Variables
Railway จะสร้าง environment variables อัตโนมัติ:
```
DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway
PGHOST=containers-us-west-1.railway.app
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=password
```

### 3. Update railway.toml
```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
PORT = "5001"
JWT_SECRET = "your-super-secret-jwt-key-change-in-production"
CORS_ORIGIN = "https://*.railway.app"
# Database will be provided by Railway PostgreSQL service
```

## 🔧 Database Migration

### 1. Install PostgreSQL Client
```bash
npm install pg @types/pg
```

### 2. Create Migration Script
```javascript
// scripts/migrate-to-postgres.js
const { Client } = require('pg');

async function migrateToPostgres() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();
  
  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      staffId VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      involvedAccountNames TEXT,
      involvedSaleNames TEXT,
      involvedSaleEmails TEXT,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      canViewOthers BOOLEAN DEFAULT false,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS contributions (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      accountName VARCHAR(255) NOT NULL,
      saleName VARCHAR(255) NOT NULL,
      saleEmail VARCHAR(255) NOT NULL,
      contributionType VARCHAR(100) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      impact VARCHAR(50) NOT NULL,
      effort VARCHAR(50) NOT NULL,
      estimatedImpactValue DECIMAL(15,2),
      contributionMonth VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      tags TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create admin user
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password', 10);
  
  await client.query(`
    INSERT INTO users (id, fullName, staffId, email, password, role, status, canViewOthers)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (email) DO NOTHING
  `, [
    'admin-001',
    'System Administrator',
    'ADMIN001',
    'admin@presale.com',
    hashedPassword,
    'admin',
    'approved',
    true
  ]);

  console.log('✅ Database migration completed');
  await client.end();
}

migrateToPostgres().catch(console.error);
```

## 🔄 Update Application

### 1. Update Database Connection
```javascript
// src/server/database/init.ts
import { Pool } from 'pg';

let pool: Pool;

export function getDatabase() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}
```

### 2. Update Queries
เปลี่ยนจาก SQLite syntax เป็น PostgreSQL syntax:
- `?` → `$1, $2, $3...`
- `CURRENT_TIMESTAMP` → `NOW()`
- `INTEGER PRIMARY KEY` → `SERIAL PRIMARY KEY`

## 📱 Benefits

✅ **Persistent Data** - ไม่หายเมื่อ restart
✅ **Scalable** - รองรับ traffic สูง
✅ **Backup** - Railway backup อัตโนมัติ
✅ **Monitoring** - มี metrics และ logs
✅ **Security** - Connection encrypted

## 🚨 Important Notes

- Database service แยกจาก app service
- ใช้ environment variables สำหรับ connection
- ต้อง migrate data จาก SQLite
- Test connection ก่อน deploy
