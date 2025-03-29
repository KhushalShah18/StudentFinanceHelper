/**
 * SmartSpend - Simplified Server for Azure Deployment
 * 
 * This is a standalone Express server that serves the static frontend files
 * and provides basic API endpoints for testing the deployment.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// For ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 8181;

// Basic environment check
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Starting SmartSpend in ${isProduction ? 'production' : 'development'} mode`);

// For parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if client/dist exists, if not create it
const staticDir = path.join(__dirname, 'client', 'dist');
if (!fs.existsSync(staticDir)) {
  console.log('Static directory not found, creating...');
  fs.mkdirSync(staticDir, { recursive: true });
  
  // Create a simple placeholder
  const indexPath = path.join(staticDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    const placeholder = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SmartSpend</title>
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 650px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
            h1 { color: #0070f3; }
            .card { border-radius: 8px; border: 1px solid #eaeaea; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>SmartSpend - Deployment Test</h1>
          <p>This is a placeholder page. Your application static files should be placed in the client/dist directory.</p>
          <div class="card">
            <h2>API Health Check</h2>
            <p>Your API is <span id="status">checking...</span></p>
            <script>
              fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                  document.getElementById('status').textContent = 'running (' + data.time + ')';
                  document.getElementById('status').style.color = 'green';
                })
                .catch(() => {
                  document.getElementById('status').textContent = 'not available';
                  document.getElementById('status').style.color = 'red';
                });
            </script>
          </div>
        </body>
      </html>
    `;
    fs.writeFileSync(indexPath, placeholder);
    console.log('Created placeholder index.html');
  }
}

// Static files - serve from client/dist
app.use(express.static(staticDir));

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: !!process.env.DATABASE_URL ? 'configured' : 'not configured',
    storage: !!process.env.AZURE_STORAGE_CONNECTION_STRING ? 'configured' : 'not configured',
    redis: !!process.env.REDIS_CONNECTION_STRING ? 'configured' : 'not configured'
  });
});

// Simple API endpoint to test that the server is running
app.get('/api/version', (req, res) => {
  res.json({
    name: 'SmartSpend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Handle all other routes by returning the main index.html (for SPA routing)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`SmartSpend server running on port ${PORT}`);
  console.log(`- Health check: http://localhost:${PORT}/api/health`);
  console.log(`- Version info: http://localhost:${PORT}/api/version`);
});