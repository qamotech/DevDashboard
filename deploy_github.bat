@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

echo ===================================================
echo   DevDashboard Hub GitHub Deployment Tool
echo ===================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo Error: Git was not found. Install Git, then run this again.
    pause
    exit /b 1
)

if not exist "index.html" (
    echo Error: index.html was not found in "%CD%".
    echo Run this script from the DevDashboard project root.
    pause
    exit /b 1
)

if not exist "apps\" (
    echo Error: apps folder was not found in "%CD%".
    echo Run this script from the DevDashboard project root.
    pause
    exit /b 1
)

echo Step 1: Preparing local Git repository...
if not exist ".git\" (
    git init
    if errorlevel 1 goto :fail
) else (
    echo Existing Git repository found.
)
echo.

echo Step 2: Staging deployable files...
git add index.html apps/ deploy_github.bat
if errorlevel 1 goto :fail
if exist "Pages\" git add Pages/
if errorlevel 1 goto :fail
if exist "package.json" git add package.json
if errorlevel 1 goto :fail
echo.

echo Step 3: Creating deployment commit when needed...
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Deploy static DevDashboard Hub"
    if errorlevel 1 goto :fail
) else (
    echo No staged changes to commit.
)
echo.

echo Step 4: Setting primary branch to main...
git branch -M main
if errorlevel 1 goto :fail
echo.

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "CURRENT_ORIGIN=%%R"
if defined CURRENT_ORIGIN (
    echo Current origin remote:
    echo !CURRENT_ORIGIN!
    echo.
    set /p USE_EXISTING="Use this GitHub repository? [Y/n]: "
    if /i "!USE_EXISTING!"=="n" set "CURRENT_ORIGIN="
)

if not defined CURRENT_ORIGIN (
    echo ===================================================
    echo Please create a new public repository on GitHub:
    echo 1. Open https://github.com/new in your browser
    echo 2. Repository name: DevDashboard
    echo 3. Choose "Public"
    echo 4. Leave "Add a README file" UNCHECKED
    echo 5. Click "Create repository"
    echo ===================================================
    echo.
    set /p REPO_URL="Enter the GitHub Repository URL (for example, https://github.com/Qamelot/DevDashboard.git): "
    if "!REPO_URL!"=="" (
        echo Error: No repository URL provided. Exiting.
        pause
        exit /b 1
    )

    echo.
    echo Step 5: Connecting remote origin...
    git remote remove origin >nul 2>&1
    git remote add origin "!REPO_URL!"
    if errorlevel 1 goto :fail
) else (
    echo Step 5: Keeping existing remote origin.
)
echo.

echo Step 6: Pushing codebase to GitHub...
echo You may be prompted by Git to sign in or authorize in a browser popup.
echo.
git push -u origin main
if errorlevel 1 goto :fail
echo.

echo ===================================================
echo   Deployment Push Completed
echo ===================================================
echo Next Steps:
echo 1. Go to your repository on github.com
echo 2. Go to Settings ^> Pages
echo 3. Under Build and deployment, set Source to "Deploy from a branch"
echo 4. Under Branch, choose "main" and "/(root)", then click Save.
echo 5. In 1-2 minutes, your DevDashboard will be live.
echo ===================================================
pause
exit /b 0

:fail
echo.
echo ===================================================
echo   Deployment failed. Check the Git message above.
echo ===================================================
pause
exit /b 1
