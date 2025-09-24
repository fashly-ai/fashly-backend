#!/bin/bash

# Docker Setup Script for Fashionfy Demo Integration
# This script helps set up the Docker environment

set -e

echo "🐳 Fashionfy Demo Integration - Docker Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_header "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker is installed and ready"
}

# Check if .env file exists
check_env_file() {
    print_header "Checking environment configuration..."
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Copying from env.example..."
        cp env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file with your actual configuration values"
    else
        print_status ".env file exists"
    fi
}

# Build and start services
start_services() {
    local mode=${1:-"production"}
    
    print_header "Starting services in $mode mode..."
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml down -v
        docker-compose -f docker-compose.dev.yml build --no-cache
        docker-compose -f docker-compose.dev.yml up -d
        print_status "Development services started"
        print_status "App will be available at: http://localhost:3001"
        print_status "API documentation at: http://localhost:3001/api/docs"
        print_status "Debug port: 9229"
    else
        docker-compose down -v
        docker-compose build --no-cache
        docker-compose up -d
        print_status "Production services started"
        print_status "App will be available at: http://localhost:3001"
        print_status "API documentation at: http://localhost:3001/api/docs"
        
        # If nginx profile is enabled
        if docker-compose ps | grep -q nginx; then
            print_status "Nginx reverse proxy available at: http://localhost"
        fi
    fi
}

# Run database migrations
run_migrations() {
    print_header "Running database migrations..."
    
    # Wait for the app container to be ready
    print_status "Waiting for application to be ready..."
    sleep 10
    
    # Run migrations
    if docker-compose ps | grep -q "app"; then
        docker-compose exec app pnpm run migration:run
        print_status "Database migrations completed"
    else
        print_error "Application container is not running"
        exit 1
    fi
}

# Show logs
show_logs() {
    local service=${1:-""}
    print_header "Showing logs..."
    
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Stop services
stop_services() {
    print_header "Stopping services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    print_status "Services stopped"
}

# Clean up everything
cleanup() {
    print_header "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans
    docker system prune -f
    print_status "Cleanup completed"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup [dev|prod]     - Set up and start services (default: prod)"
    echo "  start [dev|prod]     - Start services (default: prod)"
    echo "  stop                 - Stop all services"
    echo "  restart [dev|prod]   - Restart services (default: prod)"
    echo "  logs [service]       - Show logs (optionally for specific service)"
    echo "  migrate              - Run database migrations"
    echo "  cleanup              - Clean up all Docker resources"
    echo "  help                 - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup dev         - Set up development environment"
    echo "  $0 start prod        - Start production environment"
    echo "  $0 logs app          - Show application logs"
    echo "  $0 migrate           - Run database migrations"
}

# Main script logic
case "${1:-help}" in
    "setup")
        check_docker
        check_env_file
        start_services "${2:-production}"
        sleep 15
        run_migrations
        print_status "Setup completed successfully!"
        ;;
    "start")
        check_docker
        start_services "${2:-production}"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        start_services "${2:-production}"
        ;;
    "logs")
        show_logs "$2"
        ;;
    "migrate")
        run_migrations
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
