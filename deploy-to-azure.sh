#!/bin/bash
# This script prepares the SmartSpend application for Azure deployment
# It creates a deployment package with a minimal set of files

echo "==============================================="
echo "SmartSpend Azure Deployment Preparation Script"
echo "==============================================="
echo ""

# Create deployment directory
DEPLOY_DIR="azure-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo "Creating deployment package in '$DEPLOY_DIR'..."

# Copy essential server files
echo "Copying server files..."
cp app.js $DEPLOY_DIR/
cp web.config $DEPLOY_DIR/
cp .deployment $DEPLOY_DIR/
cp azure-package.json $DEPLOY_DIR/package.json

# Create client/dist directory for static files
echo "Creating directory structure..."
mkdir -p $DEPLOY_DIR/client/dist

# Copy our custom static files instead of using a placeholder
echo "Copying custom static files..."
cp -r client/dist/* $DEPLOY_DIR/client/dist/

# Create a ZIP file for easy deployment
DEPLOY_ZIP="smartspend-azure-deploy.zip"
echo "Creating deployment ZIP file '$DEPLOY_ZIP'..."
cd $DEPLOY_DIR && zip -r ../$DEPLOY_ZIP . && cd ..

echo "Deployment package created successfully!"
echo ""
echo "To deploy to Azure, you have several options:"
echo ""
echo "Option 1: Upload the ZIP file directly"
echo "1. Log into Azure Portal"
echo "2. Go to your Web App"
echo "3. Navigate to 'Deployment Center' > 'Manual deployment' > 'Zip Deploy'"
echo "4. Upload the '$DEPLOY_ZIP' file"
echo ""
echo "Option 2: Use Azure CLI"
echo "az webapp deployment source config-zip --resource-group <YourResourceGroup> --name <YourWebAppName> --src $DEPLOY_ZIP"
echo ""
echo "Option 3: Manual file upload"
echo "1. Navigate to the '$DEPLOY_DIR' directory"
echo "2. Upload these files via FTPS or Kudu console to the wwwroot folder"
echo ""