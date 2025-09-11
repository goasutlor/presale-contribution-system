# Railway Deployment Guide

## 🚀 Railway Deployment

Railway เป็น platform ที่ให้ HTTPS built-in และง่ายต่อการ deploy

### ✅ Features ที่ Railway ให้:
- **HTTPS Automatic**: Railway จัดการ SSL certificates ให้อัตโนมัติ
- **Custom Domain**: สามารถใช้ domain ตัวเองได้
- **Environment Variables**: ตั้งค่าได้ผ่าน dashboard
- **Auto Deploy**: Deploy อัตโนมัติเมื่อ push code

### 🔧 การตั้งค่า:

1. **สร้าง Railway Project**:
   - ไปที่ [railway.app](https://railway.app)
   - สร้าง account และ project ใหม่
   - Connect กับ GitHub repository

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5001
   DB_PATH=/app/data/presale_contributions.db
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   CORS_ORIGIN=https://*.railway.app
   ```

3. **Deploy**:
   - Railway จะ build และ deploy อัตโนมัติ
   - ใช้ `railway.toml` สำหรับ configuration
   - HTTPS จะทำงานอัตโนมัติ

### 🔐 HTTPS Configuration:

Railway จัดการ HTTPS ให้อัตโนมัติ:
- SSL certificates ถูกสร้างและจัดการโดย Railway
- Traffic ถูก redirect ไป HTTPS อัตโนมัติ
- ไม่ต้องตั้งค่า SSL certificates เอง

### 📱 การเข้าถึง:

- **HTTPS URL**: `https://your-app-name.railway.app`
- **Health Check**: `https://your-app-name.railway.app/api/health`
- **API**: `https://your-app-name.railway.app/api/*`

### 🛠️ Troubleshooting:

1. **Healthcheck Failed**:
   - ตรวจสอบว่า root endpoint `/` ทำงาน
   - ตรวจสอบ database connection

2. **CORS Issues**:
   - ตรวจสอบ `CORS_ORIGIN` environment variable
   - ใช้ `origin: true` ใน production

3. **Database Issues**:
   - ตรวจสอบ `DB_PATH` environment variable
   - ตรวจสอบ permissions ของ data directory

### 📊 Monitoring:

- ดู logs ได้ใน Railway dashboard
- ตรวจสอบ metrics และ performance
- ตั้งค่า alerts ได้

### 🔄 Auto Deploy:

- Push code ไป GitHub จะ deploy อัตโนมัติ
- ใช้ GitHub Actions สำหรับ CI/CD
- ตั้งค่า branch protection ได้

## 🎉 ข้อดีของ Railway:

- ✅ **HTTPS Built-in**: ไม่ต้องตั้งค่า SSL
- ✅ **Easy Deploy**: Deploy ได้ง่าย
- ✅ **Auto Scaling**: Scale อัตโนมัติ
- ✅ **Monitoring**: มี monitoring tools
- ✅ **Custom Domain**: ใช้ domain ตัวเองได้
- ✅ **Environment Variables**: ตั้งค่าได้ง่าย
