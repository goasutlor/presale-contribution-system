@echo off
echo ========================================
echo แก้ไขปัญหา Git Push
echo ========================================

echo.
echo 1. กำลังตั้งค่า remote origin...
git remote add origin https://github.com/goasutlor/presale-contribution-system.git

echo.
echo 2. กำลังตรวจสอบ remote...
git remote -v

echo.
echo 3. กำลัง push ไปที่ GitHub...
git push -u origin main

echo.
echo ========================================
echo ✅ Push เสร็จสิ้น!
echo ========================================
echo.
echo Repository: https://github.com/goasutlor/presale-contribution-system
echo.
pause
