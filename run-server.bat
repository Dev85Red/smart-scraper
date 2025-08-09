@REM run-server.bat
@echo off
title Start Smart Scraper Server

:: Navigate to your project directory
cd /d D:\projects\automation-projects\smart-scraper

:: Start the server
echo 🚀 Starting Node server on http://localhost:3000 ...
start http://localhost:3000
start cmd /k "node server.js"

pause
