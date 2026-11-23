@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
where gh >nul 2>nul || (echo GitHub CLI required: https://cli.github.com/ & exit /b 1)
where git >nul 2>nul || (echo Git required: https://git-scm.com/ & exit /b 1)
gh auth status >nul 2>nul || (echo Please run: gh auth login & exit /b 1)
for /f "usebackq delims=" %%I in (`gh api user --jq .login 2^>nul`) do set "GH_LOGIN=%%I"
if "%GH_LOGIN%"=="" (echo Could not identify authenticated GitHub account. & exit /b 1)
echo Publishing to account: %GH_LOGIN%
choice /C YN /N /M "Publish public repository word-world? [Y/N]: "
if errorlevel 2 exit /b 1
if exist ".git" (echo Existing Git metadata detected. Publish from a fresh extracted archive. & exit /b 1)
git init -b main || exit /b 1
git add . || exit /b 1
git -c user.name="Word World Contributors" -c user.email="contributors@word-world.invalid" commit -m "Initial open-source release" || exit /b 1
gh repo view "%GH_LOGIN%/word-world" >nul 2>nul
if not errorlevel 1 (
  echo Repository exists: %GH_LOGIN%/word-world
  git remote add origin "https://github.com/%GH_LOGIN%/word-world.git" || exit /b 1
  git push -u origin main || exit /b 1
) else (
  gh repo create word-world --public --source . --remote origin --push || exit /b 1
)
echo Published: https://github.com/%GH_LOGIN%/word-world
