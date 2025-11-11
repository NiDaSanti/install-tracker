#!/bin/bash

echo "🚀 Starting Installation Tracker Setup..."

# Backend setup
echo "📦 Setting up backend..."
cd server
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created server/.env file"
fi
npm install
echo "✅ Backend dependencies installed"

# Frontend setup
echo "📦 Setting up frontend..."
cd ../client
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created client/.env file"
fi
npm install
echo "✅ Frontend dependencies installed"

cd ..
echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd server && npm run dev"
echo "2. Frontend: cd client && npm start"
