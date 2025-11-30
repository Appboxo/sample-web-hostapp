#!/bin/bash

# Stop any previously running instances
./stop.sh 2>/dev/null

echo "Starting ngrok..."
# Use fixed domain if provided, otherwise use default
NGROK_DOMAIN="${NGROK_DOMAIN:-sample-web-hostapp.ngrok.app}"

if [ -n "$NGROK_DOMAIN" ]; then
  echo "Using fixed domain: $NGROK_DOMAIN"
  ngrok http 3001 --domain="$NGROK_DOMAIN" > /tmp/ngrok_sample_web_hostapp.log 2>&1 &
else
  echo "Using random domain (will change on restart)"
  ngrok http 3001 > /tmp/ngrok_sample_web_hostapp.log 2>&1 &
fi
NGROK_PID=$!
echo "ngrok started (PID: $NGROK_PID)"

# Wait for ngrok to establish tunnel
sleep 5

# Get ngrok public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" == "null" ]; then
  # Fallback if jq is not available
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
fi

# Set REACT_APP_MINIAPP_URL to fixed miniapp domain (port 3000)
# Miniapp runs separately on port 3000 with domain: summer.ngrok.dev
export REACT_APP_MINIAPP_URL="${REACT_APP_MINIAPP_URL:-https://summer.ngrok.dev}"
echo "Set REACT_APP_MINIAPP_URL=$REACT_APP_MINIAPP_URL"

echo "Starting sample-web-hostapp dev server..."
# Start React dev server in the background (port 3001) with environment variable
pnpm dev > /tmp/sample_web_hostapp_dev.log 2>&1 &
DEV_PID=$!
echo "Dev server started (PID: $DEV_PID) on port 3001"

# Wait for dev server to start
sleep 8

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Host App URL: $NGROK_URL"
echo "Local URL: http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To stop: ./stop.sh"
echo "Or: kill $DEV_PID $NGROK_PID"

# Store PIDs for stop script
echo "$DEV_PID" > /tmp/sample_web_hostapp_dev.pid
echo "$NGROK_PID" > /tmp/ngrok_sample_web_hostapp.pid

