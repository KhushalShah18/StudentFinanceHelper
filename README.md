# SmartSpend - Financial Management for International Students

A comprehensive financial management platform designed specifically for international students, leveraging Azure services to provide seamless expense tracking, budgeting, and collaborative financial planning.

## Simplified Azure Deployment Instructions

We've created a simplified deployment method specifically for Azure Web App that bypasses many common deployment issues.

### Method 1: Using the Deployment Script (Recommended)

1. **Run the deployment preparation script**
   ```bash
   # Make the script executable
   chmod +x deploy-to-azure.sh
   
   # Run the script
   ./deploy-to-azure.sh
   ```

2. **Deploy the generated package to Azure**
   - A new folder named `azure-deploy` will be created containing the minimal files needed
   - You can deploy this folder directly to your Azure Web App using any of these methods:
     - Azure Portal → Web App → "Deployment Center" → "FTP" (upload the contents)
     - Azure CLI with zip deployment
     - Azure Portal → Web App → "Advanced Tools" (Kudu) → "Zip Deploy"

3. **Configure environment variables in Azure Portal**
   - In your Web App, go to "Configuration" → "Application settings"
   - Add the following settings:
     ```
     NODE_ENV = production
     SESSION_SECRET = [generate a secure random string]
     DATABASE_URL = [your PostgreSQL connection string]
     AZURE_STORAGE_CONNECTION_STRING = [your Azure Storage connection string]
     REDIS_CONNECTION_STRING = [your Redis connection string]
     ```

4. **Verify the deployment**
   - Visit your Azure Web App URL (https://[your-app-name].azurewebsites.net)
   - You should see a placeholder page confirming successful deployment
   - Check the API health endpoint at /api/health

### Method 2: Manual Configuration

1. **Create a new Azure Web App**
   - Go to the Azure Portal
   - Create a new Web App with Node.js 20
   - Choose Windows OS for best compatibility with our approach

2. **Prepare your files for deployment**
   Copy these key files:
   - `app.js` - Standalone server for Azure
   - `azure-package.json` (rename to `package.json`) - Simplified package manifest
   - `web.config` - IIS configuration
   - `.deployment` - Azure deployment settings

3. **Upload files through FTP or Kudu console**
   - Access your Kudu console at https://[your-app-name].scm.azurewebsites.net
   - Navigate to the wwwroot folder
   - Upload the above files
   - Create a `client/dist` folder and add your built frontend files

4. **Set environment variables**
   Same as in Method 1, step 3

### Method 3: Deploy with Full Source Code (Advanced)

If you need to deploy the complete application with full functionality:

1. **Build the frontend locally**
   ```bash
   # Install dependencies
   npm install
   
   # Build frontend
   npm run build
   ```

2. **Create a deployment package**
   - Copy the `client/dist` folder (built frontend)
   - Include the server files (specifically `app.js`)
   - Include the necessary configuration files (web.config, .deployment)
   - Use `azure-package.json` as your package.json

3. **Deploy to Azure**
   - Use the Azure Web App deployment options (Git, ZIP, FTP, etc.)
   - Configure environment variables as shown above

### Custom Domain Configuration

1. **In Azure Portal, go to your Web App**
   - Navigate to "Custom domains"
   - Click "Add custom domain"

2. **Configure DNS Settings**
   - Add an A record pointing to your Web App's IP address
   - Add a TXT record for domain verification
   - Follow the prompts in Azure Portal

3. **Add SSL Certificate**
   - In Custom domains section, select your domain
   - Click "Add binding" to create a free Azure-managed certificate
   - Or import your own certificate

### Troubleshooting Azure Deployment

#### Common Issues and Fixes

1. **Application Won't Start**
   - Check logs in Azure Portal → "Monitoring" → "Log stream"
   - Verify environment variables are set
   - Check "iisnode" folder in Kudu console for detailed logs

2. **Missing Dependencies**
   - Make sure you're using the correct package.json (use azure-package.json)
   - In Kudu console, run `npm install` in the wwwroot directory

3. **Static Content Not Loading**
   - Verify client/dist folder exists with your built files
   - Check web.config for correct static content rules

4. **Configuration Issues**
   - Double-check web.config for correct paths
   - Verify app.js is in the root directory

5. **Database Connection Errors**
   - Make sure DATABASE_URL is correct
   - Add Azure Web App IP to your database firewall rules
   - Test connection string locally first

#### Using Kudu for Advanced Troubleshooting
1. Go to https://[your-app-name].scm.azurewebsites.net
2. Use "Debug Console" to browse files and check logs
3. Check for error logs in LogFiles/Application and iisnode folders

## Features
- Expense tracking and categorization
- Budget planning and monitoring
- Financial alerts and notifications
- Community-driven financial tips
- Local deals and discounts
- CSV data import/export

## Technology Stack
- Frontend: React.js with Tailwind CSS
- Backend: Node.js with Express
- Database: Azure PostgreSQL
- Caching: Azure Redis Cache
- Storage: Azure Blob Storage