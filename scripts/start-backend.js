const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to backend directory
const backendDir = path.join(__dirname, '..', 'backend');

// Check if backend directory exists, create if not
if (!fs.existsSync(backendDir)) {
  console.log('Backend directory not found, creating...');
  fs.mkdirSync(backendDir, { recursive: true });
}

// Start the backend server
console.log('Starting backend server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

// Handle process events
serverProcess.on('error', (error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Backend server process exited with code ${code}`);
  process.exit(code);
});

// Handle SIGINT to properly terminate child process
process.on('SIGINT', () => {
  console.log('Stopping backend server...');
  serverProcess.kill('SIGINT');
}); 