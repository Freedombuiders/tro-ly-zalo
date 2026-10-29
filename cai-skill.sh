#!/usr/bin/env bash
# Cài skill "tro-ly-zalo" cho Claude Code và Codex. Sau đó mở Claude Code gõ /tro-ly-zalo, hoặc Codex gõ $tro-ly-zalo.
#   curl -fsSL https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/cai-skill.sh | bash
set -euo pipefail

URL="https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md"
TMP="$(mktemp)"
curl -fsSL "$URL" -o "$TMP"

for DIR in "$HOME/.claude/skills/tro-ly-zalo" "${CODEX_HOME:-$HOME/.codex}/skills/tro-ly-zalo"; do
  mkdir -p "$DIR"
  cp "$TMP" "$DIR/SKILL.md"
  echo "Đã cài skill vào $DIR"
done
rm -f "$TMP"

echo
echo "Xong. Mở Claude Code (lệnh: claude) rồi gõ:  /tro-ly-zalo"
echo "Hoặc mở Codex (lệnh: codex) rồi gõ:          \$tro-ly-zalo"
