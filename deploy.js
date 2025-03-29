#!/usr/bin/env node

/**
 * This is a helper script for deploying SmartSpend to Azure Web App
 * Execute with: node deploy.js
 */

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('===== SmartSpend Azure Deployment Helper =====');
console.log('This script will help prepare your application for Azure deployment');
console.log('');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Output: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function main() {
  try {
    // Check for Azure CLI
    try {
      await executeCommand('az --version');
      console.log('✅ Azure CLI is installed');
    } catch (error) {
      console.error('❌ Azure CLI is not installed. Please install it before continuing.');
      console.log('Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli');
      process.exit(1);
    }

    // Login to Azure
    console.log('\nPlease login to Azure...');
    await executeCommand('az login');

    // Collect information
    const resourceGroup = await askQuestion('Enter your Azure Resource Group name: ');
    const appName = await askQuestion('Enter your Azure Web App name (default: SmartSpend): ') || 'SmartSpend';
    const location = await askQuestion('Enter Azure region (default: eastus): ') || 'eastus';
    const useDomain = await askQuestion('Do you want to configure a custom domain? (y/n): ');
    
    let domain = '';
    if (useDomain.toLowerCase() === 'y') {
      domain = await askQuestion('Enter your custom domain (e.g., smartspend.example.com): ');
    }

    // Create Resource Group if it doesn't exist
    console.log(`\nChecking if Resource Group ${resourceGroup} exists...`);
    const rgCheck = await executeCommand(`az group exists --name ${resourceGroup}`);
    if (rgCheck.trim() === 'false') {
      console.log(`Creating Resource Group ${resourceGroup}...`);
      await executeCommand(`az group create --name ${resourceGroup} --location ${location}`);
    }

    // Create App Service Plan
    const planName = `${appName}-plan`;
    console.log(`\nCreating App Service Plan ${planName}...`);
    await executeCommand(`az appservice plan create --name ${planName} --resource-group ${resourceGroup} --sku B1 --is-linux`);

    // Create Web App
    console.log(`\nCreating Web App ${appName}...`);
    await executeCommand(`az webapp create --name ${appName} --resource-group ${resourceGroup} --plan ${planName} --runtime "NODE|20-lts"`);

    // Configure App Settings
    console.log('\nConfiguring App Settings...');
    await executeCommand(`az webapp config appsettings set --resource-group ${resourceGroup} --name ${appName} --settings "NODE_ENV=production" "PORT=8181" "SCM_DO_BUILD_DURING_DEPLOYMENT=true" "WEBSITE_NODE_DEFAULT_VERSION=~20"`);

    // Ask for database connection string
    const dbUrl = await askQuestion('Enter your PostgreSQL DATABASE_URL (leave blank to configure later): ');
    if (dbUrl) {
      await executeCommand(`az webapp config appsettings set --resource-group ${resourceGroup} --name ${appName} --settings "DATABASE_URL=${dbUrl}"`);
    }

    // Ask for Azure Storage connection string
    const storageConn = await askQuestion('Enter your Azure Storage Connection String (leave blank to configure later): ');
    if (storageConn) {
      await executeCommand(`az webapp config appsettings set --resource-group ${resourceGroup} --name ${appName} --settings "AZURE_STORAGE_CONNECTION_STRING=${storageConn}"`);
    }

    // Ask for Redis connection string
    const redisConn = await askQuestion('Enter your Redis Connection String (leave blank to configure later): ');
    if (redisConn) {
      await executeCommand(`az webapp config appsettings set --resource-group ${resourceGroup} --name ${appName} --settings "REDIS_CONNECTION_STRING=${redisConn}"`);
    }

    // Configure Session Secret
    const sessionSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await executeCommand(`az webapp config appsettings set --resource-group ${resourceGroup} --name ${appName} --settings "SESSION_SECRET=${sessionSecret}"`);

    // Configure Custom Domain
    if (domain) {
      console.log(`\nConfiguring custom domain ${domain}...`);
      console.log('Before proceeding, make sure to:');
      console.log('1. Configure DNS records for your domain');
      console.log('2. Create an A record pointing to the Azure Web App IP address');
      
      const proceed = await askQuestion('Have you configured DNS records? (y/n): ');
      if (proceed.toLowerCase() === 'y') {
        await executeCommand(`az webapp domain add --resource-group ${resourceGroup} --webapp-name ${appName} --hostname ${domain}`);
        
        // Enable HTTPS
        const enableHttps = await askQuestion('Do you want to enable HTTPS with a free certificate? (y/n): ');
        if (enableHttps.toLowerCase() === 'y') {
          await executeCommand(`az webapp config hostname-binding list --resource-group ${resourceGroup} --webapp-name ${appName}`);
          await executeCommand(`az webapp config ssl create --resource-group ${resourceGroup} --name ${appName} --hostname ${domain}`);
        }
      } else {
        console.log('Please configure DNS records before adding the custom domain.');
      }
    }

    // Set up deployment source
    console.log('\nHow would you like to deploy your code?');
    console.log('1. GitHub');
    console.log('2. Local Git');
    console.log('3. Configure manually later');
    
    const deployChoice = await askQuestion('Enter your choice (1-3): ');
    
    if (deployChoice === '1') {
      console.log('\nTo configure GitHub deployment:');
      console.log('1. Go to Azure Portal: https://portal.azure.com');
      console.log(`2. Navigate to your Web App (${appName})`);
      console.log('3. Go to "Deployment Center" and select GitHub');
      console.log('4. Follow the prompts to connect your GitHub account and repository');
    } else if (deployChoice === '2') {
      await executeCommand(`az webapp deployment source config-local-git --resource-group ${resourceGroup} --name ${appName}`);
      console.log('\nLocal Git repository URL:');
      const gitInfo = await executeCommand(`az webapp deployment source show --resource-group ${resourceGroup} --name ${appName} --query repoUrl --output tsv`);
      console.log(`\nAdd the Azure remote to your Git repository with:`);
      console.log(`git remote add azure ${gitInfo.trim()}`);
      console.log('\nThen deploy with:');
      console.log('git push azure main');
    }

    console.log('\n===== Deployment Setup Complete =====');
    console.log(`Your Azure Web App is available at: https://${appName}.azurewebsites.net`);
    if (domain) {
      console.log(`Your custom domain will be available at: https://${domain} (after DNS propagation)`);
    }
    console.log('\nRemember to configure any missing connection strings in the Azure Portal!');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main();