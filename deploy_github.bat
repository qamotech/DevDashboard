@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"

set "NO_PAUSE=0"
if /i "%~1"=="--no-pause" set "NO_PAUSE=1"

echo.
echo  ==========================================================
echo    N8 NEXUS // GITHUB PAGES DEPLOYMENT
echo  ==========================================================
echo.

where git >nul 2>&1 || call :fail "Git is not installed or is not on PATH."
if errorlevel 1 exit /b 1
if not exist "index.html" call :fail "index.html is missing from the project root."
if errorlevel 1 exit /b 1

if not exist ".git\" (
  echo [1/7] Initializing repository...
  git init || call :fail "Git could not initialize this folder."
  if errorlevel 1 exit /b 1
) else (
  echo [1/7] Repository detected.
)

echo [2/7] Running the full quality gate...
where npm >nul 2>&1
if not errorlevel 1 if exist "package.json" (
  call npm run build || call :fail "The quality gate failed. Fix the errors above, then deploy again."
  if errorlevel 1 exit /b 1
) else (
  echo       npm is unavailable; continuing with the static files.
)

echo [3/7] Staging all repository changes...
git add --all || call :fail "All changes could not be staged."
if errorlevel 1 exit /b 1

git diff --cached --quiet
if errorlevel 1 (
  git -c user.name="N8 Deploy" -c user.email="n8-deploy@users.noreply.github.com" commit -m "Deploy N8 Nexus to GitHub Pages" || call :fail "Git could not create the deployment commit."
  if errorlevel 1 exit /b 1
) else (
  echo       No new file changes; using the current commit.
)

echo [4/7] Confirming the main branch...
git branch -M main || call :fail "The main branch could not be selected."
if errorlevel 1 exit /b 1

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo.
  set /p "REPO_URL=Paste the GitHub repository URL: "
  if not defined REPO_URL call :fail "A GitHub repository URL is required."
  if errorlevel 1 exit /b 1
  git remote add origin "%REPO_URL%" || call :fail "The origin remote could not be added."
  if errorlevel 1 exit /b 1
)

echo [5/7] Synchronizing with GitHub...
git fetch origin main >nul 2>&1
if not errorlevel 1 (
  git merge-base --is-ancestor origin/main main >nul 2>&1
  if errorlevel 1 (
    call :fail "GitHub contains commits that are not in this folder. Pull and review them before deploying."
    exit /b 1
  )
)

echo [6/7] Publishing the main branch...
git push -u origin main || call :fail "The push failed. Check sign-in, connection, and repository access."
if errorlevel 1 exit /b 1

echo [7/7] Enabling GitHub Pages from main / root...
where gh >nul 2>&1
if errorlevel 1 goto :manual_pages
gh auth status >nul 2>&1
if errorlevel 1 goto :manual_pages
gh api --method POST "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
if errorlevel 1 gh api --method PUT "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
if errorlevel 1 goto :manual_pages
echo       GitHub Pages is configured.
goto :success

:manual_pages
echo       The push succeeded. Automatic Pages setup was unavailable.
echo       In GitHub: Settings ^> Pages ^> Deploy from a branch ^> main ^> /(root) ^> Save.

:success
for /f "delims=" %%U in ('git remote get-url origin 2^>nul') do set "ORIGIN_URL=%%U"
echo.
echo  ==========================================================
echo    DEPLOYMENT COMPLETE
echo  ==========================================================
echo    Repository: %ORIGIN_URL%
echo    Branch: main / root
echo.
if exist "push-complete.html" (
  echo    Launching push celebration...
  start "N8 Push Complete" "%CD%\push-complete.html"
) else (
  echo    Celebration page not found: push-complete.html
)
if "%NO_PAUSE%"=="0" pause
exit /b 0

:fail
echo.
echo  [FAILED] %~1
echo.
if "%NO_PAUSE%"=="0" pause
exit /b 1
