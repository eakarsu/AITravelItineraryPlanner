#!/bin/bash

# AI Travel Itinerary Planner - Startup Script
# This script cleans up used ports, seeds the database, and starts the application
# with hot reloading enabled for development

set -e

echo "============================================"
echo "  AI Travel Itinerary Planner - Startup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=4000
FRONTEND_PORT=3000
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESET_DB=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --reset) RESET_DB=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to print colored messages
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        print_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to check if PostgreSQL is running
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        if pg_isready -q; then
            print_status "PostgreSQL is running"
            return 0
        fi
    fi

    # Try connecting directly
    if psql -U postgres -c '\q' 2>/dev/null; then
        print_status "PostgreSQL is accessible"
        return 0
    fi

    print_error "PostgreSQL is not running!"
    echo ""
    echo "Please start PostgreSQL first:"
    echo "  - macOS: brew services start postgresql"
    echo "  - Linux: sudo systemctl start postgresql"
    echo "  - Windows: Start PostgreSQL service from Services"
    echo ""
    return 1
}

# Cleanup function
cleanup() {
    echo ""
    print_warning "Shutting down..."

    # Kill background processes
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Kill any remaining processes on our ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT

    print_status "Cleanup complete"
    exit 0
}

# Set up trap for cleanup on exit
trap cleanup SIGINT SIGTERM

# Step 1: Clean up used ports
echo ""
print_info "Step 1: Cleaning up used ports..."
echo "-------------------------------------------"

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

print_status "Ports cleaned up (using ports $BACKEND_PORT and $FRONTEND_PORT only)"

# Step 2: Check PostgreSQL
echo ""
print_info "Step 2: Checking PostgreSQL..."
echo "-------------------------------------------"

if ! check_postgres; then
    exit 1
fi

# Step 3: Install dependencies
echo ""
print_info "Step 3: Installing dependencies..."
echo "-------------------------------------------"

cd "$PROJECT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=travel_planner
DB_USER=postgres
DB_PASSWORD=postgres

# Backend Configuration
BACKEND_PORT=4000

# Frontend Configuration
FRONTEND_PORT=3000

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Demo User Credentials (for login auto-populate)
DEMO_EMAIL=demo@travelplanner.com
DEMO_PASSWORD=Demo123!
EOF
    print_status ".env file created. Please update with your OpenRouter API key."
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install --silent

# Install nodemon globally for hot reloading if not installed
if ! command -v nodemon &> /dev/null; then
    print_info "Installing nodemon for hot reloading..."
    npm install -g nodemon --silent 2>/dev/null || npm install nodemon --save-dev --silent
fi

print_status "Backend dependencies installed"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install --silent
print_status "Frontend dependencies installed"

# Step 4: Setup database and seed data
echo ""
print_info "Step 4: Setting up database and seeding data..."
echo "-------------------------------------------"

cd "$PROJECT_DIR/backend"

if [ "$RESET_DB" = true ]; then
    print_warning "Resetting database (dropping all tables)..."
    node src/seed.js --reset
else
    node src/seed.js
fi

print_status "Database seeded with sample data"

# Step 5: Start the application with hot reloading
echo ""
print_info "Step 5: Starting the application with HOT RELOADING..."
echo "-------------------------------------------"

# Create nodemon config for backend if it doesn't exist
if [ ! -f "$PROJECT_DIR/backend/nodemon.json" ]; then
    cat > "$PROJECT_DIR/backend/nodemon.json" << 'EOF'
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["node_modules"],
  "exec": "node src/index.js"
}
EOF
fi

# Start backend with nodemon for hot reloading
cd "$PROJECT_DIR/backend"
print_info "Starting backend server on port $BACKEND_PORT (with hot reload)..."

# Check if nodemon is available
if command -v nodemon &> /dev/null; then
    nodemon src/index.js &
elif [ -f "./node_modules/.bin/nodemon" ]; then
    ./node_modules/.bin/nodemon src/index.js &
else
    print_warning "Nodemon not found, using regular node (no hot reload for backend)"
    node src/index.js &
fi
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    print_error "Backend failed to start!"
    exit 1
fi

print_status "Backend server started (PID: $BACKEND_PID) - Changes will auto-reload"

# Start frontend (React already has hot reloading built-in)
cd "$PROJECT_DIR/frontend"
print_info "Starting frontend server on port $FRONTEND_PORT (with hot reload)..."
BROWSER=none npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
    print_error "Frontend failed to start!"
    exit 1
fi

print_status "Frontend server started (PID: $FRONTEND_PID) - Changes will auto-reload"

# Final output
echo ""
echo "============================================"
echo -e "${GREEN}  Application Started Successfully!${NC}"
echo "============================================"
echo ""
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo ""
echo -e "  ${YELLOW}HOT RELOADING ENABLED:${NC}"
echo "    - Frontend: React auto-reloads on file changes"
echo "    - Backend: Nodemon restarts on file changes"
echo ""
echo "  Demo Login Credentials:"
echo "    Email:    demo@travelplanner.com"
echo "    Password: Demo123!"
echo ""
echo "  Or click 'Use Demo Credentials' button on login page"
echo ""
echo "  Features with 15+ seeded items:"
echo "    - Trips, Destinations, Activities"
echo "    - Accommodations, Transportation, Restaurants"
echo "    - Budgets, Documents, Packing Lists"
echo "    - Travel Tips, Emergency Contacts, Reviews"
echo "    - Photos, Notes, AI Assistant"
echo ""
echo "  Usage:"
echo "    ./start.sh          - Normal start"
echo "    ./start.sh --reset  - Reset database and start fresh"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "============================================"
echo ""

# Open browser (optional)
if command -v open &> /dev/null; then
    sleep 2
    open "http://localhost:$FRONTEND_PORT"
elif command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open "http://localhost:$FRONTEND_PORT"
fi

# Keep script running and show logs
wait
