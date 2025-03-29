import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Check and log environment configuration for deployment
if (process.env.NODE_ENV === 'production') {
  console.log('Starting SmartSpend in production mode...');
  
  // Log important environment variables (without their values for security)
  console.log('Environment check:');
  [
    'PORT',
    'NODE_ENV', 
    'DATABASE_URL', 
    'AZURE_STORAGE_CONNECTION_STRING', 
    'REDIS_CONNECTION_STRING'
  ].forEach(key => {
    console.log(`- ${key}: ${process.env[key] ? 'Set' : 'Not set'}`);
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS for API requests from custom domain
app.use((req, res, next) => {
  // Allow any origin in development
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [req.headers.origin || ''] // In production, only allow the specific origin
    : ['*'];
    
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the specified port or fallback to 8181 for Azure Web App
  // this serves both the API and the client
  const port = process.env.PORT || 8181;
  server.listen({
    port,
    host: "20.48.204.10",
    reusePort: true,
  }, () => {
    log(`Now listening on: http://0.0.0.0:${port}`);
  });
})();
