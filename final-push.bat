@echo off
echo ========================================
echo Final Git Push with Build ID
echo ========================================

echo.
echo 1. กำลัง add ไฟล์ทั้งหมดรวมถึง build-id.txt...
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
- Railway database compatibility with ALTER TABLE ADD COLUMN IF NOT EXISTS
- Add build-id.txt for Docker build cache busting"

echo.
echo 3. กำลังตั้งค่า remote origin...
git remote add origin https://github.com/goasutlor/presale-contribution-system.git

echo.
echo 4. กำลัง push ไปที่ GitHub...
git push -u origin main

echo.
echo ========================================
echo ✅ Push เสร็จสิ้น!
echo ========================================
echo.
echo Repository: https://github.com/goasutlor/presale-contribution-system
echo Build ID: build-2025-01-27-blog-links-feature
echo.
echo ตอนนี้ Railway จะสามารถ build ได้แล้ว!
echo.
pause
