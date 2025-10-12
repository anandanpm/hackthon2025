#!/bin/bash

# React Chat App with Rocket.Chat Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up React Chat App with Rocket.Chat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20.19+ or 22.12+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: 20.19+ or 22.12+"
fi

print_status "Starting Rocket.Chat server with Docker Compose..."

# Start Rocket.Chat and MongoDB
docker-compose up -d

print_status "Waiting for MongoDB to start..."
sleep 10

print_status "Initializing MongoDB replica set..."
docker exec mongo mongosh --eval "rs.initiate()" > /dev/null 2>&1

print_status "Waiting for Rocket.Chat to start (this may take 2-3 minutes)..."
print_warning "Please be patient while Rocket.Chat initializes..."

# Wait for Rocket.Chat to be ready
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Rocket.Chat is ready!"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 10
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_error "Rocket.Chat failed to start within expected time."
    print_status "Check logs with: docker logs rocketchat"
    exit 1
fi

print_status "Setting up React chat app..."

# Navigate to chat app directory
cd chat-app

# Install dependencies
print_status "Installing React app dependencies..."
npm install

print_success "Setup complete! 🎉"
echo ""
echo "📋 Next steps:"
echo "1. Go to http://localhost:3000 to complete Rocket.Chat setup"
echo "   - Create your admin account"
echo "   - Enable CORS in Admin Settings → General → REST API → CORS (set to *)"
echo "2. Create users in Rocket.Chat admin panel"
echo "3. Start the React app:"
echo "   cd chat-app && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "🔧 Useful commands:"
echo "  docker-compose logs -f          # View Rocket.Chat logs"
echo "  docker-compose down             # Stop Rocket.Chat"
echo "  docker-compose up -d            # Start Rocket.Chat"
echo "  npm run dev                     # Start React app"
echo ""
print_success "Happy chatting! 💬"

