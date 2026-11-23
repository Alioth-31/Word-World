@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
if not defined ANDROID_HOME if exist "%LOCALAPPDATA%\Android\Sdk\platforms" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_HOME%\platforms" if exist "%LOCALAPPDATA%\Android\Sdk\platforms" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_HOME%\platforms" (
  echo Android SDK not found. Please configure ANDROID_HOME.
  goto fail
)
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
where node >nul 2>nul || (echo Node.js 22+ required for build. & goto fail)
where npm >nul 2>nul || (echo npm is missing. & goto fail)
where java >nul 2>nul || (echo Java JDK 21+ required. & goto fail)
echo [1/5] Installing project dependencies...
call npm install --no-audit --no-fund || goto fail
echo [2/5] Preparing the exam vocabulary and FSRS scheduler...
call npm run build || goto fail
echo [3/5] Preparing Android Capacitor project...
if not exist "android\gradlew.bat" call npx --no-install cap add android
if not exist "android\gradlew.bat" goto fail
call npx --no-install cap sync android || goto fail
call npx --no-install capacitor-assets generate --android --assetPath assets --iconBackgroundColor "#14272e" --splashBackgroundColor "#14272e" || goto fail
echo [4/5] Building Android APK...
pushd android
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (popd & goto fail)
popd
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" goto fail
echo [5/5] Copying APK to output folder...
if not exist output mkdir output
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "output\word-world-debug.apk" >nul
echo.
echo SUCCESS: output\word-world-debug.apk
pause
exit /b 0
:fail
echo.
echo Build failed. See README.md and the error above.
pause
exit /b 1
