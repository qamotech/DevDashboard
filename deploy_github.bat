@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"

set "NO_PAUSE=0"
set "CHECK_ONLY=0"

:parse_args
if "%~1"=="" goto :args_ready
if /i "%~1"=="--no-pause" set "NO_PAUSE=1"& shift& goto :parse_args
if /i "%~1"=="--check" set "CHECK_ONLY=1"& shift& goto :parse_args
call :fail "Unknown option: %~1"
exit /b 1

:args_ready
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
  if "%CHECK_ONLY%"=="1" call :fail "This folder is not a Git repository."
  if errorlevel 1 exit /b 1
  echo [1/8] Initializing repository...
  git init || call :fail "Git could not initialize this folder."
  if errorlevel 1 exit /b 1
  git branch -M main || call :fail "The main branch could not be created."
  if errorlevel 1 exit /b 1
) else (
  echo [1/8] Repository detected.
)

for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH call :fail "Git is in a detached HEAD state. Switch to the main branch first."
if errorlevel 1 exit /b 1
if /i not "%CURRENT_BRANCH%"=="main" call :fail "Current branch is %CURRENT_BRANCH%. Switch to main before deploying."
if errorlevel 1 exit /b 1

echo [2/8] Running the full quality gate...
where npm >nul 2>&1
if not errorlevel 1 if exist "package.json" (
  call npm run build || call :fail "The quality gate failed. Fix the errors above, then deploy again."
  if errorlevel 1 exit /b 1
) else (
  echo       npm is unavailable; continuing with the static files.
)

echo [3/8] Confirming the GitHub remote...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  if "%CHECK_ONLY%"=="1" call :fail "The origin remote is not configured."
  if errorlevel 1 exit /b 1
  set /p "REPO_URL=Paste the GitHub repository URL: "
  if not defined REPO_URL call :fail "A GitHub repository URL is required."
  if errorlevel 1 exit /b 1
  git remote add origin "%REPO_URL%" || call :fail "The origin remote could not be added."
  if errorlevel 1 exit /b 1
)

if "%CHECK_ONLY%"=="1" goto :check_remote

echo [4/8] Synchronizing safely with GitHub...
git fetch origin --prune || call :fail "GitHub could not be reached. Check the connection and repository access."
if errorlevel 1 exit /b 1
git show-ref --verify --quiet refs/remotes/origin/main
if not errorlevel 1 (
  git rebase --autostash origin/main || call :rebase_fail
  if errorlevel 1 exit /b 1
) else (
  echo       GitHub does not have a main branch yet; the first push will create it.
)

echo [5/8] Staging repository changes...
git add --all || call :fail "All changes could not be staged."
if errorlevel 1 exit /b 1

git diff --cached --quiet
if errorlevel 1 (
  git -c user.name="N8 Deploy" -c user.email="n8-deploy@users.noreply.github.com" commit -m "Deploy N8 Nexus to GitHub Pages" || call :fail "Git could not create the deployment commit."
  if errorlevel 1 exit /b 1
) else (
  echo       No new file changes; using the current commit.
)

echo [6/8] Publishing the main branch...
git push -u origin main || call :fail "The push failed. Check sign-in, connection, and repository access."
if errorlevel 1 exit /b 1

echo [7/8] Enabling GitHub Pages from main / root...
where gh >nul 2>&1
if errorlevel 1 goto :manual_pages
gh auth status >nul 2>&1
if errorlevel 1 goto :manual_pages
gh api --method POST "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
if errorlevel 1 gh api --method PUT "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
if errorlevel 1 goto :manual_pages
echo       GitHub Pages is configured.
goto :pages_ready

:manual_pages
echo       The push succeeded. Automatic Pages setup was unavailable.
echo       In GitHub: Settings ^> Pages ^> Deploy from a branch ^> main ^> /(root) ^> Save.

:pages_ready
echo [8/8] Deployment checks complete.
goto :success

:check_remote
echo [4/8] Checking GitHub without changing files...
git fetch --dry-run origin >nul 2>&1 || call :fail "GitHub could not be reached. Check the connection and repository access."
if errorlevel 1 exit /b 1
echo       Check mode passed. No commit, rebase, push, or Pages change was made.
goto :check_success

:check_success
echo.
echo  ==========================================================
echo    DEPLOYMENT CHECK PASSED
echo  ==========================================================
echo    Branch: main
echo    Run deploy_github.bat to synchronize and publish.
echo.
if "%NO_PAUSE%"=="0" pause
exit /b 0

:rebase_fail
echo.
echo  [FAILED] Git could not replay local commits on top of GitHub main.
echo           Resolve the reported conflict, then run the deploy file again.
echo           Your uncommitted work was protected with Git autostash.
echo.
if "%NO_PAUSE%"=="0" pause
exit /b 1

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
