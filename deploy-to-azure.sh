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

# Create a simple index.html to test deployment
echo "Creating a placeholder index.html..."
cat > $DEPLOY_DIR/client/dist/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartSpend</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 650px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #0070f3;
      margin-bottom: 0.5rem;
    }
    p {
      margin: 1rem 0;
    }
    .card {
      border-radius: 8px;
      border: 1px solid #eaeaea;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>SmartSpend Deployment Successful</h1>
  <p>If you're seeing this page, your Azure deployment was successful! This is a placeholder page.</p>
  
  <div class="card">
    <h2>Next Steps</h2>
    <p>Replace this static content with your built application frontend:</p>
    <ol>
      <li>Build your front-end application locally</li>
      <li>Upload the built files to the 'client/dist' directory on your Azure Web App</li>
      <li>Test your full application</li>
    </ol>
  </div>
  
  <div class="card">
    <h2>API Health Check</h2>
    <p>Your API is <span id="api-status">checking...</span></p>
    <script>
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          document.getElementById('api-status').textContent = 'running (' + data.time + ')';
          document.getElementById('api-status').style.color = 'green';
        })
        .catch(err => {
          document.getElementById('api-status').textContent = 'not available';
          document.getElementById('api-status').style.color = 'red';
        });
    </script>
  </div>
</body>
</html>
EOF

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