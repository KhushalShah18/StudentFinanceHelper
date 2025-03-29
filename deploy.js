// This script is used to handle environment variables during deployment
console.log('Starting deployment configuration for SmartSpend...');

// Set custom port if not provided by Azure
if (!process.env.PORT) {
  process.env.PORT = 8181;
  console.log('Setting default port to 8181');
}

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

console.log('Configuration complete. Ready to serve from custom domain.');