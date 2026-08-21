@echo off
setlocal

REM Procura o index.html na pasta deste arquivo e nas subpastas.
set "INDEX_FILE="
for /f "delims=" %%I in ('dir /s /b "%~dp0index.html" 2^>nul') do if not defined INDEX_FILE set "INDEX_FILE=%%I"

if not defined INDEX_FILE (
    echo.
    echo ERRO: index.html nao foi encontrado.
    echo Execute este arquivo a partir da pasta que contem o dashboard.
    echo.
    pause
    exit /b 1
)

REM Descobre a pasta que contem o index.html.
for %%I in ("%INDEX_FILE%") do set "PROJECT_DIR=%%~dpI"
set "URL=http://127.0.0.1:5502/index.html"
set "PYTHON_CMD="

where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py"

if not defined PYTHON_CMD (
    where python >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo.
    echo ERRO: Python nao foi encontrado neste computador.
    echo Instale Python em https://www.python.org/downloads/ e marque "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

REM Encerra qualquer servidor antigo que esteja usando a porta 5502.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5502" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>nul

echo.
echo Pasta correta do dashboard:
echo %PROJECT_DIR%
echo.
echo Iniciando o dashboard...

REM O /D define a pasta de trabalho do processo Python de forma explicita.
start "Dashboard PCM" /D "%PROJECT_DIR%" /B %PYTHON_CMD% -m http.server 5502 --bind 127.0.0.1

timeout /t 2 /nobreak >nul

REM Abre o navegador somente depois de confirmar que index.html responde HTTP 200.
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%URL%'; if ($r.StatusCode -ne 200) { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
    echo.
    echo ERRO: o servidor iniciou, mas nao conseguiu entregar index.html.
    echo Pasta testada: %PROJECT_DIR%
    echo Verifique se o index.html esta nesta pasta.
    echo.
    pause
    exit /b 1
)

echo Servidor validado sem erro 404.
echo Abrindo %URL% ...
start "" "%URL%"
echo.
echo Dashboard aberto com sucesso. Esta janela pode ser fechada.
exit /b 0
