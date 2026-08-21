@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
  echo Arraste o ficheiro .xlsm sobre este arquivo.
  pause
  exit /b 1
)
where py >nul 2>nul
if not errorlevel 1 (
  py scripts\convert_excel.py "%~1"
  goto :done
)
where python >nul 2>nul
if not errorlevel 1 (
  python scripts\convert_excel.py "%~1"
  goto :done
)
echo.
echo ERRO: Python nao foi encontrado neste computador.
echo Instale Python em https://www.python.org/downloads/ e marque "Add Python to PATH".
pause
exit /b 1
:done
if errorlevel 1 (
  echo.
  echo ERRO: a conversao falhou. Verifique a mensagem acima.
  pause
  exit /b 1
)
echo.
echo Dados atualizados em data\explosao.json e data\plano-mes.json.
pause
