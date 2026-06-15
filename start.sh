#!/bin/bash
set -euo pipefail

echo "Solutiva Court — starting dev stack"
echo "  Web: http://localhost:3000"
echo "  API: http://localhost:4000/health"
echo ""

if ! command -v docker &>/dev/null; then
  echo "Docker is required. Install Docker Desktop, then run: npm run docker:up"
  exit 1
fi

npm run docker:up
npm run dev
