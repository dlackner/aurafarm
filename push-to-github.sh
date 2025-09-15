#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="dlackner"

# Add the remote origin (using SSH)
git remote add origin "git@github.com:${GITHUB_USERNAME}/aurafarm.git"

# Push to GitHub
git branch -M main
git push -u origin main

echo "Code pushed to GitHub successfully!"
echo "Next steps:"
echo "1. Go to https://render.com"
echo "2. Create a new Web Service"
echo "3. Connect your GitHub account and select the 'aurafarm' repository"
echo "4. Use these settings:"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: node server.js"
echo "   - Environment: Node"
echo "5. Deploy!"