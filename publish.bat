@echo off
setlocal
title Miki-Astro - publikalas
cd /d "%~dp0"

echo.
echo   ==========================================
echo     Miki-Astro  -  publikalas GitHub Pages-re
echo   ==========================================
echo.

rem --- git megkeresese: eloszor a PATH-on, aztan a GitHub Desktop csomagjaban
set "GIT=git"
where git >nul 2>nul || (
    set "GIT="
    for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%D\resources\app\git\cmd\git.exe" set "GIT=%%D\resources\app\git\cmd\git.exe"
    )
)
if not defined GIT (
    echo   HIBA: nem talalom a git-et.
    echo   Telepitsd: winget install --id Git.Git -e
    echo.
    pause
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo   HIBA: nem talalom a Python-t a PATH-ban.
    pause
    exit /b 1
)

echo   [1/3] Uj kepek beolvasasa es WebP generalasa...
echo.
python scan.py
if errorlevel 1 (
    echo.
    echo   HIBA: a beolvasas nem sikerult, a publikalas leallt.
    pause
    exit /b 1
)

echo.
echo   [2/3] Valtozasok rogzitese...
"%GIT%" add -A
"%GIT%" diff --cached --quiet
if not errorlevel 1 (
    echo   Nincs valtozas - nincs mit publikalni.
    echo.
    pause
    exit /b 0
)
"%GIT%" status --short
for /f "tokens=1-3 delims=/. " %%a in ("%DATE%") do set "STAMP=%%c-%%b-%%a"
"%GIT%" commit -q -m "Album frissites %STAMP%"

echo.
echo   [3/3] Feltoltes a GitHubra...
"%GIT%" push origin main
if errorlevel 1 (
    echo.
    echo   A feltoltes nem sikerult. Ha bejelentkezest ker, csinald meg egyszer
    echo   a GitHub Desktopban, utana ez a script mar menni fog.
    pause
    exit /b 1
)

echo.
echo   ==========================================
echo     KESZ. Par perc mulva elerheto:
echo     https://buddymajki.github.io/miki-astro/
echo   ==========================================
echo.
pause
