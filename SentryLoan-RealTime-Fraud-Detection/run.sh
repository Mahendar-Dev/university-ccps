#!/bin/bash
echo "======================================================="
echo "Starting Bank Loan Fraud Detection System..."
echo "======================================================="

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Install it from https://nodejs.org/"
    exit 1
fi

(cd backend && npm start) &
BACKEND_PID=$!

sleep 2

(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend running (PID $BACKEND_PID) on http://localhost:4000"
echo "Frontend running (PID $FRONTEND_PID) on http://localhost:5173"
echo "Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
