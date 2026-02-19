#!/bin/bash

# CYBERFUNK OVERDRIVE Backend Setup Script
# Helps configure and deploy the backend server

echo "🎮 CYBERFUNK OVERDRIVE - Backend Setup"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env created. Edit it with your database credentials if needed."
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env if you want to use a MySQL database (optional)"
echo "2. Run: npm start"
echo "3. Server will run on http://localhost:3000"
echo ""
echo "To deploy to Render:"
echo "1. Push to GitHub"
echo "2. Go to render.com"
echo "3. Create new Web Service from this repository"
echo "4. Build: npm install"
echo "5. Start: npm start"
echo ""
