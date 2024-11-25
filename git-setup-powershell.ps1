Write-Host "Cleaning up old git repositories..."
if (Test-Path .git) { Remove-Item -Recurse -Force .git }
if (Test-Path client\.git) { Remove-Item -Recurse -Force client\.git }

Write-Host "Initializing Git repository..."
git init

Write-Host "Adding files..."
git add server\*
git add client\src\*
git add client\public\*
git add client\package.json
git add client\.env
git add package.json
git add railway.toml
git add .gitignore
git add client\.gitignore
git add .npmrc
git add client\.npmrc

Write-Host "Creating initial commit..."
git commit -m "Initial commit"

Write-Host "Adding remote repository..."
git remote add origin https://github.com/jiangwei6/weishao_key.git

Write-Host "Setting up main branch..."
git branch -M main

Write-Host "Force pushing to main branch..."
git push -f origin main

Write-Host "Done!"
pause 