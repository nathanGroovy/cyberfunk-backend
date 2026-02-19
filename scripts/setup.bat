@echo off
REM CYBERFUNK OVERDRIVE Backend Setup Script
REM Helps configure and deploy the backend server

echo.
echo 🎮 CYBERFUNK OVERDRIVE - Backend Setup
echo ======================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Check if .env exists
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ .env created. Edit it with your database credentials if needed.
) else (
    echo ℹ️  .env file already exists
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env if you want to use a MySQL database (optional)
echo 2. Run: npm start
echo 3. Server will run on http://localhost:3000
echo.
echo To deploy to Render:
echo 1. Push to GitHub
echo 2. Go to render.com
echo 3. Create new Web Service from this repository
echo 4. Build: npm install
echo 5. Start: npm start
echo.
pause
