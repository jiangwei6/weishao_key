@echo off
echo Cleaning up old git repositories...
if exist .git rmdir /s /q .git
if exist client\.git rmdir /s /q client\.git

echo Initializing Git repository...
git init

echo Adding all files...
git add server\*.*
git add server\routes\*.*
git add server\models\*.*
git add server\middleware\*.*

git add client\src\*.*
git add client\src\pages\*.*
git add client\src\components\*.*
git add client\src\utils\*.*
git add client\public\*.*
git add client\package.json
git add client\.env

git add package.json
git add railway.toml
git add .gitignore
git add client\.gitignore
git add .npmrc
git add client\.npmrc

echo Creating initial commit...
git commit -m "Initial commit"

echo Adding remote repository...
git remote add origin https://github.com/你的用户名/新仓库名.git

echo Pushing to main branch...
git push -u origin main

echo Done!
pause 