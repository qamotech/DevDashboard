@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo   DevDashboard Apps Push Tool
echo ===================================================
echo.

echo Checking repository status...
git status --short

echo.
echo Staging the full apps tree, root redirect, deploy script, and tracked moves...
git add -A apps/
if exist index.html git add index.html
git add deploy_github.bat
git add -u

echo.
echo Staged changes:
git diff --cached --name-status

git diff --cached --quiet
if %ERRORLEVEL%==0 (
    echo.
    echo No changes staged. Nothing to commit or push.
    pause
    exit /b 0
)

echo.
set /p COMMIT_MSG="Commit message (leave blank for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update DevDashboard apps

echo.
echo Creating commit...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo Commit failed. Resolve any Git messages above and retry.
    pause
    exit /b 1
)

echo.
echo Pushing to origin main...
git push origin main
if errorlevel 1 (
    echo Push failed. Check authentication, remote URL, or pull/rebase requirements.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   Apps changes pushed successfully.
echo ===================================================
echo Launching celebration...
start "" "%~dp0apps\DevDash\push-complete.html"
pause
