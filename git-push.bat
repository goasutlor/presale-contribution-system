@echo off
echo ========================================
echo กำลัง Push ไปที่ GitHub Repository
echo ========================================

echo.
echo 1. กำลัง add ไฟล์ทั้งหมด...
git add .

echo.
echo 2. กำลัง commit การเปลี่ยนแปลง...
git commit -m "feat: Add blog links field and fix user profile refresh

- Add blogLinks field to database schema (PostgreSQL)
- Update all API endpoints to handle blogLinks  
- Add blog links support to UserForm and ProfileForm components
- Fix automatic data refresh after profile updates
- Display blog links as clickable badges in UserManagement
- Support multiple blog links with add/remove functionality
- Railway database compatibility with ALTER TABLE ADD COLUMN IF NOT EXISTS"

echo.
echo 3. กำลัง push ไปที่ GitHub...
git push origin main

echo.
echo ========================================
echo ✅ Push เสร็จสิ้น!
echo ========================================
echo.
echo การเปลี่ยนแปลงที่ถูก push:
echo - เพิ่มฟิลด์ blogLinks ในฐานข้อมูล
echo - แก้ไขปัญหา refresh ข้อมูลอัตโนมัติ
echo - เพิ่มการจัดการ blog links ใน User Management
echo - รองรับการ deploy บน Railway
echo.
pause
