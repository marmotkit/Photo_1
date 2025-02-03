@echo off
:: 設置命令行編碼為 UTF-8
chcp 65001
echo 啟動相簿管理系統...
echo.

:: 檢查 Node.js 是否安裝
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 未檢測到 Node.js，請先安裝 Node.js
    pause
    exit /b
)

:: 設置工作目錄
set "WORKSPACE_DIR=%~dp0"
cd /d "%WORKSPACE_DIR%"

:: 創建必要的目錄結構
echo 檢查並創建必要的目錄...
if not exist "backend\uploads" (
    echo 創建上傳目錄...
    mkdir "backend\uploads"
)

if not exist "backend\data" (
    echo 創建數據存儲目錄...
    mkdir "backend\data"
)

:: 檢查前後端依賴是否已安裝
if not exist "frontend\node_modules" (
    echo 安裝前端依賴...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\node_modules" (
    echo 安裝後端依賴...
    cd backend
    call npm install
    cd ..
)

:: 檢查數據文件是否存在，如果不存在則創建初始文件
if not exist "backend\data\albums.json" (
    echo 創建初始相簿數據文件...
    echo [] > "backend\data\albums.json"
)

if not exist "backend\data\categories.json" (
    echo 創建初始類別數據文件...
    (
        echo {
        echo   "categories": [
        echo     {
        echo       "id": 1,
        echo       "name": "通用",
        echo       "createdAt": "%date:~0,4%-%date:~5,2%-%date:~8,2%T00:00:00.000Z",
        echo       "updatedAt": "%date:~0,4%-%date:~5,2%-%date:~8,2%T00:00:00.000Z"
        echo     }
        echo   ]
        echo }
    ) > "backend\data\categories.json"
)

:: 啟動後端服務
echo 啟動後端服務...
start "Photo Album Backend" cmd /k "chcp 65001 && cd backend && node server.js"

:: 等待後端服務啟動
timeout /t 5 /nobreak

:: 啟動前端服務
echo 啟動前端服務...
start "Photo Album Frontend" cmd /k "chcp 65001 && cd frontend && npm run dev"

:: 等待前端啟動
timeout /t 5 /nobreak

:: 自動打開瀏覽器
echo 正在打開應用程序...
start http://localhost:5173

echo.
echo 服務已啟動！
echo 前端地址：http://localhost:5173
echo 後端地址：http://localhost:5001
echo.
echo 按任意鍵關閉所有服務...
pause > nul

:: 關閉所有相關的進程
taskkill /f /im node.exe > nul 2>&1
echo 服務已關閉。
timeout /t 2 > nul 