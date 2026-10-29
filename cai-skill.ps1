# Cài skill "tro-ly-zalo" cho Claude Code và Codex trên Windows. Sau đó mở Claude Code gõ /tro-ly-zalo, hoặc Codex gõ $tro-ly-zalo.
#   irm https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/cai-skill.ps1 | iex
$ErrorActionPreference = 'Stop'

$url = 'https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
$noiDung = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

foreach ($dir in @((Join-Path $HOME '.claude\skills\tro-ly-zalo'), (Join-Path $codexHome 'skills\tro-ly-zalo'))) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $dir 'SKILL.md'), $noiDung, (New-Object System.Text.UTF8Encoding $false))
  Write-Host "Da cai skill vao $dir"
}

Write-Host ''
Write-Host 'Xong. Mo Claude Code (lenh: claude) roi go:  /tro-ly-zalo'
Write-Host 'Hoac mo Codex (lenh: codex) roi go:          $tro-ly-zalo'
