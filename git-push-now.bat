@echo off
echo ========================================
echo กำลังทำ Git Push
echo ========================================

echo.
echo 1. กำลังตรวจสอบสถานะ Git...
git status

echo.
echo 2. กำลัง add ไฟล์ทั้งหมด...
git add .

echo.
echo 3. กำลัง commit การเปลี่ยนแปลง...
git commit -m "feat: Add blog links field and fix user profile refresh

- Add blogLinks field to database schema (PostgreSQL)
- Update all API endpoints to handle blogLinks  
- Add blog links support to UserForm and ProfileForm components
- Fix automatic data refresh after profile updates
- Display blog links as clickable badges in UserManagement
- Support multiple blog links with add/remove functionality
- Railway database compatibility with ALTER TABLE ADD COLUMN IF NOT EXISTS"

echo.
echo 4. กำลัง push ไปที่ GitHub...
git push origin main

echo.
echo ========================================
echo ✅ Push เสร็จสิ้น!
echo ========================================
echo.
echo Repository: https://github.com/goasutlor/presale-contribution-system
echo.
pause
