---
name: tro-ly-zalo
description: Tải Trợ lý Zalo từ GitHub (Freedombuiders/tro-ly-zalo) về máy, cài Node.js nếu thiếu, cài thư viện, rồi cài agent đọc Bộ não số 2 của doanh nghiệp và chăm sóc khách, đại lý hoặc nhân viên trong các nhóm Zalo. Dùng khi người dùng gõ /tro-ly-zalo hoặc $tro-ly-zalo, hoặc nói "cài trợ lý Zalo", "tải trợ lý Zalo", "tạo agent chăm sóc nhóm Zalo", "chatbot Zalo cho doanh nghiệp".
---

# Tải và cài Trợ lý Zalo

Người dùng thường mới chỉ cài Claude Code hoặc Codex: máy có thể **chưa có Node.js, chưa có Git**, và họ không phải lập trình viên. Nói tiếng Việt, ngắn, mỗi lần một bước, báo đang ở bước nào. Lệnh lỗi thì đọc lỗi, sửa, thử lại; không bắt người dùng tự gỡ.

**Hỏi trước khi:** cài phần mềm hệ thống (Node.js), đăng nhập tài khoản, bật gửi tin thật. Codex: lệnh tải về và `npm install` cần mạng, hãy xin quyền chạy ngoài sandbox.

Nhận biết hệ điều hành trước (`uname` hoặc `$env:OS`). Dưới đây `<DA>` là thư mục dự án:

- macOS, Linux: `~/tro-ly-zalo`
- Windows: `$HOME\tro-ly-zalo` (ví dụ `C:\Users\Lan\tro-ly-zalo`)

## 1. Tải mã nguồn

Nếu `<DA>/package.json` đã có và chứa `"name": "tro-ly-zalo"`: cập nhật bằng `git -C <DA> pull` nếu là thư mục git, không thì giữ nguyên. Không xoá `data/` và `cau-hinh.yaml` (phiên Zalo và cấu hình của người dùng). Sang bước 2.

Chưa có thì tải về:

- **Có Git dùng được** thì clone. Trên macOS chỉ coi là có Git khi `xcode-select -p` chạy thành công (nếu không, gõ `git` sẽ bật hộp thoại cài Xcode). Trên Windows, Linux thì kiểm tra `git --version`.
  ```bash
  git clone --depth 1 https://github.com/Freedombuiders/tro-ly-zalo.git ~/tro-ly-zalo
  ```
- **Không có Git** thì tải file ZIP:
  - macOS (dùng `ditto`, **không dùng `unzip`**: `unzip` của macOS làm hỏng tên file tiếng Việt có dấu):
    ```bash
    curl -fL -o /tmp/tro-ly-zalo.zip https://github.com/Freedombuiders/tro-ly-zalo/archive/refs/heads/main.zip \
      && rm -rf /tmp/tro-ly-zalo-main && ditto -x -k /tmp/tro-ly-zalo.zip /tmp && mv /tmp/tro-ly-zalo-main ~/tro-ly-zalo
    ```
  - Linux: như trên nhưng thay `ditto -x -k /tmp/tro-ly-zalo.zip /tmp` bằng `unzip -q /tmp/tro-ly-zalo.zip -d /tmp`.
  - Windows PowerShell:
    ```powershell
    Invoke-WebRequest https://github.com/Freedombuiders/tro-ly-zalo/archive/refs/heads/main.zip -OutFile "$env:TEMP\tro-ly-zalo.zip"
    Expand-Archive "$env:TEMP\tro-ly-zalo.zip" -DestinationPath $env:TEMP -Force
    Move-Item "$env:TEMP\tro-ly-zalo-main" "$HOME\tro-ly-zalo"
    ```

## 2. Node.js 20 trở lên

Kiểm tra `node -v`. Có v20 trở lên thì sang bước 3. Thiếu hoặc cũ thì hỏi người dùng rồi cài:

- **Windows**:
  ```powershell
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  ```
  Windows có thể hỏi quyền quản trị, người dùng bấm Yes. Phiên terminal hiện tại chưa nhận PATH mới, nên các lệnh sau dùng đường dẫn đầy đủ `& "C:\Program Files\nodejs\npm.cmd"` (hoặc nhờ người dùng mở lại Claude Code hay Codex). Không có winget thì hướng dẫn tải bản LTS ở https://nodejs.org và cài như phần mềm thường.
- **macOS**:
  - Có Homebrew (`brew -v`) thì chạy `brew install node`.
  - Không có thì tải bộ cài chính thức rồi mở ra:
    ```bash
    V=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | grep -o 'node-v[0-9.]*\.pkg' | head -1)
    curl -fL -o ~/Downloads/$V https://nodejs.org/dist/latest-v22.x/$V && open ~/Downloads/$V
    ```
    Nhắn người dùng bấm Tiếp tục, Cài đặt và nhập mật khẩu máy. Chờ họ báo xong rồi kiểm tra bằng `/usr/local/bin/node -v`. Nếu `node` chưa có trong PATH của phiên này thì dùng `/usr/local/bin/npm`.
- **Linux**: hướng dẫn theo https://nodejs.org/en/download (trình quản lý gói của bản phân phối).

## 3. Cài thư viện

```bash
cd ~/tro-ly-zalo && npm install
```

Trên Windows PowerShell dùng `npm.cmd` thay cho `npm` ở mọi lệnh, để tránh lỗi "running scripts is disabled": `cd $HOME\tro-ly-zalo; npm.cmd install`.

## 4. Cài agent

Đọc `<DA>/.agents/skills/cai-dat-tro-ly-zalo/SKILL.md` và làm theo từ đầu đến cuối: trỏ tới Bộ não số 2, đọc bộ não, hỏi chủ doanh nghiệp, viết agent, chạy thử, đăng nhập Zalo bằng QR, giao nhóm.

- Mọi lệnh `npm run ...` phải chạy trong `<DA>`. Thư mục làm việc của phiên này có thể là chỗ khác, nên luôn `cd` trước.
- Người dùng chưa đưa đường dẫn Bộ não số 2: hỏi họ (kéo thả thư mục vào khung chat). Họ muốn xem thử trước thì dùng bộ não mẫu có sẵn của công ty du lịch hư cấu Sen Vàng (`./bo-nao-mau`).
- Người dùng muốn thực hành với dữ liệu thật của VN Express Tour (VNE): chạy `npm run mau-vne` (cần mạng; bảng lịch khởi hành có sau vài giây, hơn 500 lịch trình chi tiết tải thêm 5-10 phút: đặt thời gian chờ 10 phút hoặc chạy nền; bị ngắt thì chạy lại, lệnh tải tiếp chỗ còn thiếu) rồi làm tiếp từ mục "Chạy thử" của skill cài đặt, bỏ qua các mục trỏ bộ não, đọc bộ não, hỏi chủ doanh nghiệp, viết agent. Thử `tu-van-vne` với câu của khách lẻ và `ai-sales-vne` với câu của đại lý.
- `npm run dang-nhap` chờ người dùng quét QR tới vài phút: chạy nền hoặc đặt thời gian chờ dài (5 phút).

## 5. Kết thúc

Tóm tắt cho người dùng: agent nào, chăm nhóm nào, chế độ nháp hay tự gửi. Đưa họ lệnh chạy hằng ngày ở một cửa sổ terminal riêng (để chạy tiếp khi đóng phiên này):

- macOS, Linux: `cd ~/tro-ly-zalo && npm start`
- Windows: `cd $HOME\tro-ly-zalo; npm.cmd start`
