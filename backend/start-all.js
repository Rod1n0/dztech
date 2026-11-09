import { spawn } from 'child_process';

const processes = [];

function startProcess(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
  });
  processes.push(child);
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

console.log('Starting DzTech Full-Stack Application (Backend API + React Frontend)...');
startProcess('Backend', 'node', ['backend/server.js']);
startProcess('Frontend', 'npx', ['vite']);

process.on('SIGINT', () => {
  for (const p of processes) {
    p.kill('SIGINT');
  }
  process.exit(0);
});
