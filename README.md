# SmartSpend - Financial Management for International Students

A comprehensive financial management platform designed specifically for international students, leveraging Azure services to provide seamless expense tracking, budgeting, and collaborative financial planning.

## Deployment to Azure Web App with Custom Domain

### Prerequisites
1. An Azure subscription
2. Azure CLI installed (for command-line deployment)
3. A custom domain that you own
4. Node.js 20.x installed

### Configuration Files
This repository includes several files to help with Azure deployment:
- `.deployment` - Basic deployment command configuration
- `web.config` - IIS configuration for hosting Node.js applications
- `azure-settings.json` - Sample application settings

### Steps to Deploy with Custom Domain

1. **Create an Azure Web App**
   ```
   az webapp create --resource-group <YourResourceGroup> --plan <YourAppServicePlan> --name SmartSpend --runtime "NODE|20-lts"
   ```

2. **Configure App Settings**
   ```
   az webapp config appsettings set --resource-group <YourResourceGroup> --name SmartSpend --settings @azure-settings.json
   ```

3. **Deploy the Application**
   ```
   az webapp deployment source config-local-git --resource-group <YourResourceGroup> --name SmartSpend
   ```

4. **Add your Custom Domain**
   ```
   az webapp domain add --resource-group <YourResourceGroup> --webapp-name SmartSpend --hostname <YourCustomDomain>
   ```

5. **Set up SSL Binding**
   ```
   az webapp config ssl bind --resource-group <YourResourceGroup> --name SmartSpend --certificate-thumbprint <YourCertThumbprint> --ssl-type SNI
   ```

### Manual Deployment Steps
1. In the Azure Portal, navigate to your Web App
2. Go to "Deployment Center" 
3. Choose your preferred deployment method (GitHub, Azure Repos, etc.)
4. Follow the prompts to connect and deploy

### Environment Variables
Make sure to configure these environment variables in Azure App Service:
- `DATABASE_URL` - PostgreSQL connection string
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection string
- `REDIS_CONNECTION_STRING` - Redis cache connection string
- `PORT` - Default is 8181, usually auto-assigned by Azure
- `NODE_ENV` - Set to 'production'

### Custom Domain Configuration
1. In Azure Portal, go to your Web App → Custom domains
2. Follow the instructions to configure DNS records
3. Add your custom domain and validate ownership
4. Create/import an SSL certificate and bind it to your domain

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