#!/bin/bash

echo "🚀 Installation Tracker - Quick Start"
echo "===================================="
echo ""

# Check if setup has been run
if [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "⚠️  Dependencies not installed. Running setup..."
    ./setup.sh
    echo ""
fi

# Start backend
echo "🔧 Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd ../client
npm start &
FRONTEND_PID=$!
echo "✅ Frontend starting (PID: $FRONTEND_PID)"

echo ""
echo "✨ Installation Tracker is running!"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
