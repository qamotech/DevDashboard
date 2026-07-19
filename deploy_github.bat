@echo off
:: Color scheme: High-contrast Cyber Green text on Black background
color 0A
title CyberDev Network - Auto-Deploy Engine

:: Initialize interface visuals
echo ===================================================
echo [!] INITIALIZING DIGITAL ENGINE RECON
echo ===================================================
:: Success boot sound: Cybernetic multi-tone beep sequence (Ascending frequencies)
powershell -c "[console]::Beep(440,80); [console]::Beep(660,80); [console]::Beep(880,120)"

:: Step 1: Force execution context to the local directory
cd /d "%~dp0"
echo [✓] System Grid Confirmed: %CD%
echo.

:: Step 2: Synchronize Remote Repositories (Pull Payload)
echo [→] Intercepting and merging remote database payloads...
git pull origin main --no-rebase
if %ERRORLEVEL% NEQ 0 goto FAILURE_ALERT

echo [✓] Data synchronization matrix complete.
echo.

:: Step 3: Stage All Digital Assets
echo [→] Staging newly compiled frameworks...
git add .
echo [✓] Allocation complete.
echo.

:: Step 4: Verify Delta and Commit Changes
echo [→] Scanning for modified codebase clusters...
git diff-index --quiet HEAD --
if %ERRORLEVEL% EQU 0 (
    echo [✓] Zero variance detected. Network is already optimized.
    goto SUCCESS_ALERT
)

:: Construct automated localized timestamp
set datetime=%date% @ %time%
echo [→] Sealing localized block commit...
git commit -m "Auto-update: %datetime%"
echo [✓] Changes hard-coded to local tree.
echo.

:: Step 5: Execute Push Sequence to Cloud Core
echo [→] Launching data packet transmission to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 goto FAILURE_ALERT

:SUCCESS_ALERT
echo.
echo ===================================================
echo [✓] SUCCESS: REPOSITORY LINK OPTIMIZED AND SYNCED!
echo ===================================================
:: Success Sound Matrix: Mechanical Chime (Chords)
powershell -c "[console]::Beep(523,100); [console]::Beep(659,100); [console]::Beep(784,100); [console]::Beep(1047,250)"
echo Close sequence commencing in 4 seconds...
timeout /t 4 > nul
exit

:FAILURE_ALERT
echo.
echo ===================================================
echo [X] CRITICAL ERROR: TRANSMISSION INTERRUPTED
echo ===================================================
:: Failure Sound Matrix: Low Frequency Alarm (Descending / Long tones)
powershell -c "[console]::Beep(220,300); [console]::Beep(180,300); [console]::Beep(140,500)"
echo Core deployment failed. Connection terminal locked for diagnostic review.
pause
exit