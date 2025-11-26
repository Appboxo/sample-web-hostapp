#!/usr/bin/env node

// Pre-load localStorage polyfill before react-scripts starts
require('./setup-localstorage.js');

// Spawn react-scripts with all arguments and environment
const { spawn } = require('child_process');
const path = require('path');

const script = process.argv[2] || 'start';
const args = process.argv.slice(3);

// Use react-scripts directly (it will handle node_modules/.bin resolution)
const child = spawn('npx', ['react-scripts', script, ...args], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

