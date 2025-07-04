#!/bin/bash

# CarWash Tielt-Winge Project Start Script
echo "🚀 Starting CarWash Tielt-Winge Project Services..."

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Check if required ports are available
echo "📡 Checking ports..."
check_port 3001
check_port 3000

# Start Backend API
echo "🔧 Starting Backend API on port 3001..."
cd backend
if [ ! -f ".env" ]; then
    echo "📋 Creating backend .env file..."
    cp .env.example .env
fi

# Start backend in background
npm run dev &
BACKEND_PID=$!
echo "🎯 Backend API started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Start Admin Dashboard
echo "🎛️ Starting Admin Dashboard on port 3000..."
cd ../admin-dashboard

# Start admin dashboard in background
npm start &
ADMIN_PID=$!
echo "🎯 Admin Dashboard started with PID: $ADMIN_PID"

# Wait a moment for services to start
sleep 5

echo ""
echo "🌟 ==============================================="
echo "🌟 CarWash Tielt-Winge Project is now running!"
echo "🌟 ==============================================="
echo ""
echo "🌐 Backend API: http://localhost:3001"
echo "   📋 API Docs: http://localhost:3001/api-docs"
echo "   ❤️  Health: http://localhost:3001/health"
echo ""
echo "🎛️ Admin Dashboard: http://localhost:3000"
echo ""
echo "📋 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Admin: $ADMIN_PID"
echo ""
echo "🛑 To stop services, run:"
echo "   kill $BACKEND_PID $ADMIN_PID"
echo ""
echo "📖 See PREVIEW_GUIDE.md for detailed preview instructions"
echo ""

# Keep script running to monitor services
echo "🔄 Monitoring services (Ctrl+C to stop)..."
wait