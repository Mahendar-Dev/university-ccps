@echo off
echo =======================================================
echo Bank Loan Fraud Detection System - Installation
echo =======================================================
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo =======================================================
echo Installation Complete! Run "run.bat" to start the app.
echo =======================================================
pause
