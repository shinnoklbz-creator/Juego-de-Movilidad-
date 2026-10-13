@echo off
chcp 65001 >nul
echo ========================================================
echo   SUBIENDO "JUEGO DE MOVILIDAD" A GITHUB
echo   Cuenta: shinnoklbz-creator
echo   Repositorio: Juego-de-movilidad
echo ========================================================
echo.

set PATH=C:\Users\Esteban\AppData\Local\Programs\MinGit\cmd;%PATH%

echo 1. Verificando estado local...
git status
echo.

echo 2. Subiendo cambios a GitHub...
echo (Si es la primera vez, se abrira una ventana o se solicitara tu cuenta/token de GitHub)
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   ¡PROYECTO SUBIDO CON EXITO A GITHUB!
    echo   URL: https://github.com/shinnoklbz-creator/Juego-de-movilidad
    echo ========================================================
) else (
    echo.
    echo Recuerda:
    echo 1. Debes haber creado el repositorio vacio en https://github.com/new
    echo    con el nombre: Juego-de-movilidad
    echo 2. Debes tener iniciada tu sesion de GitHub en tu navegador o ingresar un Token (PAT).
)
echo.
pause
