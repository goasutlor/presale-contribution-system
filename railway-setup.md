# Railway PostgreSQL Setup Guide

## วิธีสร้าง PostgreSQL Database Service

### 1. ผ่าน Railway Dashboard
1. ไปที่ Railway Dashboard
2. เลือก Project ของคุณ
3. คลิก "+ New" หรือ "Add Service"
4. เลือก "Database" → "PostgreSQL"
5. คลิก "Add PostgreSQL"

### 2. ผ่าน Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Add PostgreSQL service
railway add postgresql

# Deploy
railway up
```

### 3. ตรวจสอบ Environment Variables
1. ไปที่ Web Service
2. คลิก "Variables" tab
3. ตรวจสอบว่า DATABASE_URL ถูกสร้างแล้ว
4. ควรมีรูปแบบ: `postgresql://username:password@host:port/database`

### 4. Manual Configuration
หาก Railway ไม่ auto-generate DATABASE_URL:
1. ไปที่ PostgreSQL Service
2. คลิก "Connect" tab
3. Copy connection string
4. ไปที่ Web Service → Variables
5. เพิ่ม DATABASE_URL = connection string

## ตรวจสอบการทำงาน
1. ดู logs ของ Web Service
2. ควรเห็น "🐘 Using PostgreSQL database"
3. ควรเห็น "🔄 Running database migration..."
4. ควรเห็น "✅ Database initialized successfully"
