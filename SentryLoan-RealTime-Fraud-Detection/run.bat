@echo off
echo =======================================================
echo Starting Bank Loan Fraud Detection System...
echo =======================================================
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo Starting backend server (port 4000)...
start "Backend - Loan Fraud API" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo Starting frontend dev server (port 5173)...
start "Frontend - Loan Fraud UI" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Once ready, open http://localhost:5173 in your browser.
pause
