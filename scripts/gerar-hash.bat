@echo off
REM Duplo clique neste arquivo para gerar o hash de uma senha.
REM Existe para nao ser preciso abrir terminal nem saber comando nenhum.
cd /d "%~dp0.."

echo.
echo   Gerador de senha do Simbionte
echo   =============================
echo.

REM Sem esta checagem, a janela piscava e fechava sem dizer o porque.
where node >nul 2>nul
if errorlevel 1 (
  echo   ERRO: o Node nao foi encontrado.
  echo.
  echo   Instale em https://nodejs.org ^(versao LTS^) e rode de novo.
  echo.
  pause
  exit /b 1
)

echo   Voce vai DIGITAR uma senha nova aqui. Nao precisa colar nada.
echo   Se preferir, so aperte Enter que eu sorteio uma forte.
echo.

node scripts/gerar-hash.mjs

echo.
echo   Para copiar: selecione com o mouse e aperte Enter.
echo   ^(no cmd, colar e com botao direito, nao Ctrl+V^)
echo.
pause
