#!/bin/bash

DEV_PID=$(cat /tmp/sample_web_hostapp_dev.pid 2>/dev/null)
NGROK_PID=$(cat /tmp/ngrok_sample_web_hostapp.pid 2>/dev/null)

if [ -n "$DEV_PID" ]; then
  echo "Stopping dev server (PID: $DEV_PID)..."
  kill "$DEV_PID" 2>/dev/null
  rm -f /tmp/sample_web_hostapp_dev.pid
fi

if [ -n "$NGROK_PID" ]; then
  echo "Stopping ngrok (PID: $NGROK_PID)..."
  kill "$NGROK_PID" 2>/dev/null
  rm -f /tmp/ngrok_sample_web_hostapp.pid
fi

# Also kill any remaining processes by name, just in case
pkill -f 'react-scripts start' 2>/dev/null
pkill -f 'ngrok http 3001' 2>/dev/null

echo "Services stopped"


