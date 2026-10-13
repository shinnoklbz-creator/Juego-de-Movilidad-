@echo off
chcp 65001 >nul
title Publicar Juego de Movilidad en GitHub

set PATH=C:\Users\Esteban\AppData\Local\Programs\gh\bin;C:\Users\Esteban\AppData\Local\Programs\MinGit\cmd;%PATH%

echo =====================================================================
echo       CONECTANDO CON TU CUENTA shinnoklbz-creator EN GITHUB
echo =====================================================================
echo.
echo 1. Se abrira tu navegador para autorizar la subida a GitHub.
echo    (Presiona Enter si te solicita confirmar).
echo.
pause

echo Iniciando autorizacion...
gh auth login --hostname github.com -p https -w

echo.
echo =====================================================================
echo 2. Creando el repositorio "Juego-de-movilidad" y subiendo archivos...
echo =====================================================================
echo.

gh repo create Juego-de-movilidad --public --source=. --remote=origin --push

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================================
    echo   ¡REPOSITORIO CREADO Y PUBLICADO CON EXITO!
    echo   Ya no saltara error 404:
    echo   https://github.com/shinnoklbz-creator/Juego-de-movilidad
    echo =====================================================================
) else (
    echo.
    echo Intentando push directo...
    git push -u origin main
)

echo.
echo Abriendo tu repositorio en el navegador...
start https://github.com/shinnoklbz-creator/Juego-de-movilidad
pause
