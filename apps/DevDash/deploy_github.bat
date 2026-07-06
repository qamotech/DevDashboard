@echo off
setlocal

set "ROOT_DEPLOY=%~dp0..\..\deploy_github.bat"

if exist "%ROOT_DEPLOY%" (
    echo Opening the project root deployment tool...
    call "%ROOT_DEPLOY%"
    exit /b %errorlevel%
)

echo Error: Could not find the project root deploy_github.bat.
echo Expected: %ROOT_DEPLOY%
pause
exit /b 1
