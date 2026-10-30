#!/usr/bin/env bash
# Cài Node.js 22 riêng cho Trợ lý Zalo vào thư mục .node của dự án: không cần mật khẩu máy, không đụng tới phần còn lại của máy.
set -euo pipefail
DA="$(cd "$(dirname "$0")" && pwd)"
case "$(uname -s)" in Darwin) OS=darwin ;; Linux) OS=linux ;; *) echo "Chưa hỗ trợ hệ điều hành $(uname -s)"; exit 1 ;; esac
case "$(uname -m)" in arm64 | aarch64) ARCH=arm64 ;; x86_64 | amd64) ARCH=x64 ;; *) echo "Chưa hỗ trợ chip $(uname -m)"; exit 1 ;; esac
URL=https://nodejs.org/dist/latest-v22.x
TAM="$(mktemp -d)"
trap 'rm -rf "$TAM"' EXIT
curl -fsSL --retry 3 -o "$TAM/SHASUMS256.txt" "$URL/SHASUMS256.txt"
TEN="$(grep -o "node-v[0-9.]*-$OS-$ARCH\.tar\.gz" "$TAM/SHASUMS256.txt" | head -1)"
echo "Đang tải $TEN (khoảng 50 MB)..."
curl -fL --retry 3 --progress-bar -o "$TAM/$TEN" "$URL/$TEN"
# Kiểm tra mã băm để chắc file tải về nguyên vẹn.
if command -v sha256sum > /dev/null; then KIEM="sha256sum -c -"; else KIEM="shasum -a 256 -c -"; fi
(cd "$TAM" && grep " $TEN\$" SHASUMS256.txt | $KIEM > /dev/null) || { echo "File tải về bị lỗi, chạy lại lệnh này."; exit 1; }
rm -rf "$DA/.node" && mkdir -p "$DA/.node"
tar -xzf "$TAM/$TEN" -C "$DA/.node" --strip-components 1
echo "Đã cài Node.js $("$DA/.node/bin/node" -v) vào $DA/.node"
echo "Trước mỗi lệnh npm trong phiên này: export PATH=\"$DA/.node/bin:\$PATH\""
