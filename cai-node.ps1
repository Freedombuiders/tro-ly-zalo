# Cài Node.js 22 riêng cho Trợ lý Zalo vào thư mục .node của dự án: không cần quyền quản trị.
# Chạy: powershell -ExecutionPolicy Bypass -File cai-node.ps1
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$DA = $PSScriptRoot
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
$url = 'https://nodejs.org/dist/latest-v22.x'
$sums = (Invoke-WebRequest "$url/SHASUMS256.txt" -UseBasicParsing).Content
$dong = ($sums -split "`n") | Where-Object { $_ -match "node-v[0-9.]+-win-$arch\.zip\s*$" } | Select-Object -First 1
$bam, $ten = $dong.Trim() -split '\s+'
$zip = Join-Path $env:TEMP $ten
Write-Output "Đang tải $ten (khoảng 30 MB)..."
Invoke-WebRequest "$url/$ten" -OutFile $zip -UseBasicParsing
# Kiểm tra mã băm để chắc file tải về nguyên vẹn.
if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $bam) { throw 'File tải về bị lỗi, chạy lại lệnh này.' }
$tam = Join-Path $env:TEMP 'tro-ly-zalo-node'
Remove-Item $tam -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $tam | Out-Null
# tar có sẵn từ Windows 10 và giải nén nhanh hơn Expand-Archive nhiều.
if (Get-Command tar.exe -ErrorAction SilentlyContinue) { tar.exe -xf $zip -C $tam } else { Expand-Archive $zip -DestinationPath $tam -Force }
Remove-Item "$DA\.node" -Recurse -Force -ErrorAction SilentlyContinue
Move-Item (Join-Path $tam ($ten -replace '\.zip$', '')) "$DA\.node"
Remove-Item $zip, $tam -Recurse -Force -ErrorAction SilentlyContinue
Write-Output "Đã cài Node.js $(& "$DA\.node\node.exe" -v) vào $DA\.node"
Write-Output "Trước mỗi lệnh npm trong phiên này: `$env:Path = `"$DA\.node;`$env:Path`""
