// Convenience launcher for the local MongoDB instance used in this
// environment. Not required if you already run your own MongoDB server —
// this only starts the bundled mongod binary under .mongo-install/ with a
// persistent dbPath (./data/db) and a single-node replica set (required for
// the multi-document transactions this app uses for transfers/payments).
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const ROOT = path.join(__dirname, '..');
const MONGOD_GLOB_DIR = path.join(ROOT, '.mongo-install');

function findMongod() {
  if (!fs.existsSync(MONGOD_GLOB_DIR)) return null;
  const entries = fs.readdirSync(MONGOD_GLOB_DIR);
  for (const entry of entries) {
    const candidate = path.join(MONGOD_GLOB_DIR, entry, 'bin', 'mongod.exe');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.setTimeout(800, () => { socket.destroy(); resolve(false); });
  });
}

async function main() {
  const alreadyRunning = await isPortOpen(27017);
  if (alreadyRunning) {
    console.log('MongoDB already appears to be running on port 27017.');
    return;
  }

  const mongodPath = findMongod();
  if (!mongodPath) {
    console.error('Could not find a local mongod binary under .mongo-install/.');
    console.error('Install MongoDB yourself and ensure it is running on mongodb://127.0.0.1:27017 with a replica set (required for transactions).');
    process.exit(1);
  }

  const dbPath = path.join(ROOT, 'data', 'db');
  fs.mkdirSync(dbPath, { recursive: true });

  const child = spawn(mongodPath, [
    '--dbpath', dbPath,
    '--port', '27017',
    '--bind_ip', '127.0.0.1',
    '--replSet', 'rs0',
    '--logpath', path.join(ROOT, 'data', 'mongod.log'),
    '--logappend',
  ], { detached: true, stdio: 'ignore' });

  child.unref();
  console.log(`Started mongod (pid ${child.pid}) with dbPath ${dbPath}.`);
  console.log('If this is the very first run, also run: node scripts/init-replica-set.js');
}

main();
