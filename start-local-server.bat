@echo off
REM Double-click to preview the site properly (needs Python installed).
REM Opening a .html file straight from disk blocks the sample data from loading,
REM so this starts a small local web server for this folder and opens the sign-in page.
title Mingalaba Local Preview
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 >nul && start http://localhost:8844/index.html"
python -m http.server 8844
