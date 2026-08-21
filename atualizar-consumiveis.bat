@echo off
setlocal

REM Entra na pasta do projeto, independentemente de onde o arquivo foi executado.
cd /d "%~dp0"

if "%~1"=="" (
  echo.
  echo Arraste a planilha Excel de Consumiveis sobre este arquivo .bat.
  echo.
  pause
  exit /b 1
)

set "PLANILHA=%~1"

if not exist "%PLANILHA%" (
  echo.
  echo ERRO: a planilha informada nao foi encontrada.
  echo.
  pause
  exit /b 1
)

where py >nul 2>nul
if not errorlevel 1 (
  py scripts\convert_consumiveis.py "%PLANILHA%"
  goto :resultado
)

where python >nul 2>nul
if not errorlevel 1 (
  python scripts\convert_consumiveis.py "%PLANILHA%"
  goto :resultado
)

echo.
echo ERRO: Python nao foi encontrado neste computador.
echo Instale Python em https://www.python.org/downloads/ e marque "Add Python to PATH".
echo.
pause
exit /b 1

:resultado
if errorlevel 1 (
  echo.
  echo ERRO: a conversao dos Consumiveis falhou.
  echo Confirme se a aba da planilha se chama consumiveis e se o cabecalho esta na linha 3.
  echo.
  pause
  exit /b 1
)

echo.
echo Consumiveis atualizados com sucesso em data\consumiveis.json.
echo Agora atualize o dashboard no navegador com Ctrl+F5.
echo Se o dashboard estiver no GitHub Pages, envie o arquivo data\consumiveis.json atualizado para o repositorio.
echo.
pause
