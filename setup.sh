#!/bin/bash

# Hospital Admin System - Quick Start Script

echo "🏥 Hospital Admin Management System - Quick Start"
echo "================================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✓ Docker found"

# Start services
echo ""
echo "Starting services with Docker Compose..."
docker-compose up -d

# Wait for database
echo ""
echo "Waiting for database to be ready..."
sleep 10

# Run migrations and seeding
echo ""
echo "Running database migrations and seeding..."
docker-compose exec -T backend npm run seed

echo ""
echo "✓ All services started successfully!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:3000/api"
echo "  Health Check: http://localhost:3000/health"
echo ""
echo "Default Credentials:"
echo "  Email: admin@hospital.com"
echo "  Password: Admin@123"
echo ""
echo "  Email: doctor1@hospital.com"
echo "  Password: Doctor@123"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f postgres"
echo ""
echo "To stop services:"
echo "  docker-compose down"
