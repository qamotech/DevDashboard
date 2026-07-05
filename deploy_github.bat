@echo off
cd %~dp0
echo ===================================================
echo   DevDashboard Hub GitHub Deployment Tool
echo ===================================================
echo.
echo Step 1: Initializing local Git repository...
git init
echo.
echo Step 2: Staging files (index.html and apps/)...
git add index.html apps/
echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit of static DevDashboard Hub"
echo.
echo Step 4: Setting primary branch to main...
git branch -M main
echo.
echo ===================================================
echo Please create a new public repository on GitHub:
echo 1. Open https://github.com/new in your browser
echo 2. Repository name: DevDashboard
echo 3. Choose "Public"
echo 4. Leave "Add a README file" UNCHECKED
echo 5. Click "Create repository"
echo ===================================================
echo.
set /p REPO_URL="Enter the GitHub Repository URL (e.g., https://github.com/Qamelot/DevDashboard.git): "
if "%REPO_URL%"=="" (
    echo Error: No repository URL provided. Exiting.
    pause
    exit /b
)
echo.
echo Step 5: Connecting remote origin...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo.
echo Step 6: Pushing codebase to GitHub...
echo (You may be prompted by Git to sign in/authorize in a browser popup)
echo.
git push -u origin main
echo.
echo ===================================================
echo   Deployment Push Completed!
echo ===================================================
echo Next Steps:
echo 1. Go to your repository on github.com
echo 2. Go to Settings > Pages
echo 3. Under Build and deployment, set Source to "Deploy from a branch"
echo 4. Under Branch, choose "main" and "/(root)", then click Save.
echo 5. In 1-2 minutes, your DevDashboard will be live!
echo ===================================================
pause
