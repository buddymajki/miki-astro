@echo off
title Miki-Astro Dashboard
cd /d "%~dp0"

echo.
echo   ==========================================
echo     Miki-Astro Dashboard
echo   ==========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo   HIBA: nem talalom a Python-t a PATH-ban.
    echo   Telepitsd innen: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

python -c "import PIL" >nul 2>nul
if errorlevel 1 (
    echo   A kepfeldolgozo konyvtar telepitese ^(Pillow^), ez egyszeri...
    python -m pip install --quiet --disable-pip-version-check Pillow
    if errorlevel 1 (
        echo   HIBA: a Pillow telepitese nem sikerult.
        pause
        exit /b 1
    )
)

python serve.py %*

echo.
pause
