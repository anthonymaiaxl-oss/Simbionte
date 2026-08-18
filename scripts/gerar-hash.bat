@echo off
REM Duplo clique neste arquivo para gerar o hash de uma senha.
REM Existe para nao ser preciso abrir terminal nem saber comando nenhum.
cd /d "%~dp0.."
echo.
echo  Gerador de senha do Simbionte
echo  =============================
echo.
node scripts/gerar-hash.mjs
echo.
echo  Selecione a linha com o mouse, Ctrl+C para copiar.
echo.
pause
