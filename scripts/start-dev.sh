#!/bin/bash
# Wrapper script to start react-scripts with NODE_OPTIONS

export NODE_OPTIONS="--localstorage-file=/tmp/localstorage.json"
export PORT="${PORT:-3001}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project directory
cd "$PROJECT_DIR"

# Execute react-scripts with all arguments using npx
exec npx react-scripts "$@"

