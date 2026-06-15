#!/bin/bash

echo "🚀 Starting Solutiva Court Web Application..."
echo "📍 Server will be available at: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3 HTTP server"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Using Python HTTP server"
    python -m http.server 8000
elif command -v node &> /dev/null; then
    echo "✅ Using Node.js HTTP server"
    npx http-server -p 8000
elif command -v php &> /dev/null; then
    echo "✅ Using PHP HTTP server"
    php -S localhost:8000
else
    echo "❌ No suitable HTTP server found"
    echo "Please install Python 3, Node.js, or PHP"
    exit 1
fi 