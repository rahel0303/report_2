/**
 * Database Proxy Server
 * Proxy untuk expose PostgreSQL database lokal ke internet
 */
const net = require('net');
const http = require('http');

const DB_HOST = '10.100.14.216';
const DB_PORT = 5432;
const PROXY_PORT = 3001;

// HTTP Server untuk health check
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', dbHost: DB_HOST, dbPort: DB_PORT }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

httpServer.listen(8080, () => {
  console.log(`HTTP health check server running on port 8080`);
});

// TCP Proxy Server untuk PostgreSQL
const server = net.createServer((clientSocket) => {
  console.log('Client connected');

  const serverSocket = new net.Socket();
  
  serverSocket.connect(DB_PORT, DB_HOST, () => {
    console.log(`Connected to database at ${DB_HOST}:${DB_PORT}`);
  });

  // Forward data from client to database
  clientSocket.on('data', (data) => {
    serverSocket.write(data);
  });

  // Forward data from database to client
  serverSocket.on('data', (data) => {
    clientSocket.write(data);
  });

  // Handle errors
  clientSocket.on('error', (err) => {
    console.error('Client socket error:', err.message);
    serverSocket.end();
  });

  serverSocket.on('error', (err) => {
    console.error('Server socket error:', err.message);
    clientSocket.end();
  });

  // Handle disconnections
  clientSocket.on('end', () => {
    console.log('Client disconnected');
    serverSocket.end();
  });

  serverSocket.on('end', () => {
    clientSocket.end();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Database proxy server running on port ${PROXY_PORT}`);
  console.log(`Forwarding to ${DB_HOST}:${DB_PORT}`);
  console.log('\nTo expose this to internet:');
  console.log(`  1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/`);
  console.log(`  2. Run: cloudflared tunnel --url tcp://localhost:${PROXY_PORT}`);
  console.log(`  3. Use the provided URL as DB_HOST in Vercel`);
});

server.on('error', (err) => {
  console.error('Proxy server error:', err);
  process.exit(1);
});
