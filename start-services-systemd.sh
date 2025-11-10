#!/bin/bash
# Start script for Foxhole Calendar Backend and Bot

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start backend in background
echo "Starting backend..."
/usr/local/bin/deno task start &
BACKEND_PID=$!

# Start bot in background
echo "Starting bot..."
/usr/local/bin/deno task bot:start &
BOT_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $BOT_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $BOT_PID 2>/dev/null || true
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $BACKEND_PID $BOT_PID

