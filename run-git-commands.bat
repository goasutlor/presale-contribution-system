@echo off
echo ========================================
echo รันคำสั่ง Git ที่คุณต้องการ
echo ========================================

echo.
echo 1. กำลัง add ไฟล์ทั้งหมด...
git add .

echo.
echo 2. กำลัง commit การเปลี่ยนแปลง...
git commit -m "feat: Add blog links field and fix user profile refresh"

echo.
echo 3. กำลังตั้งค่า remote origin...
git remote add origin https://github.com/goasutlor/presale-contribution-system.git

echo.
echo 4. กำลัง push ไปที่ GitHub...
git push -u origin main

echo.
echo ========================================
echo ✅ เสร็จสิ้น!
echo ========================================
echo.
echo Repository: https://github.com/goasutlor/presale-contribution-system
echo.
pause
