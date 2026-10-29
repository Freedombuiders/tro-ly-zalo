# Prompt cho buổi thực hành

Chỉ cần **một câu prompt**, không cần cài gì trước ngoài Claude Code hoặc Codex. Agent tự tải mã nguồn, cài Node.js nếu máy chưa có (hỏi bạn trước), cài thư viện, đọc Bộ não số 2, hỏi bạn vài câu, chạy thử, mở mã QR Zalo rồi giao nhóm.

## Cách dùng

1. Mở Terminal (Windows: PowerShell).
2. Gõ `claude` (Claude Code) hoặc `codex` (Codex), Enter.
3. Copy một prompt bên dưới (nút copy ở góc phải khung), dán vào, thay phần `<...>` rồi Enter.
4. Làm theo agent: trả lời câu hỏi, bấm đồng ý khi được hỏi quyền, quét QR bằng app Zalo.

Kéo thả thư mục Bộ não số 2 từ Finder hoặc File Explorer vào khung chat là có ngay đường dẫn.

## 1. Chăm sóc khách hàng

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent chăm sóc khách hàng cho các nhóm Zalo tôi chỉ định.
```

## 2. Chăm sóc đại lý, cộng tác viên (AI Sales)

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Danh sách sản phẩm, lịch, giá của tôi ở Google Sheet: <dán link Google Sheet>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent AI Sales trong các nhóm đại lý và cộng tác viên: nhặt sản phẩm phù hợp, kiểm tra còn chỗ hay hết chỗ, trả mã sản phẩm và hoa hồng, chuyển sales khi họ muốn giữ chỗ.
```

Google Sheet cần bật Chia sẻ > "Bất kỳ ai có đường liên kết" > Người xem.

## 3. Hỗ trợ nhân viên nội bộ

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent hỗ trợ nhân viên nội bộ trong các nhóm Zalo tôi chỉ định: trả lời quy trình, nội quy, chính sách, và lập báo giá, proposal từ bảng giá nhà cung cấp.
```

## 4. Chưa có bộ não, xem thử trước

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi chưa có bộ não: dùng bộ não mẫu (công ty du lịch Sen Vàng) để xem thử agent trả lời thế nào trước khi nối Zalo.
```

## Sau khi cài xong

Mở Claude Code hoặc Codex trong thư mục `tro-ly-zalo` (macOS: `cd ~/tro-ly-zalo`, Windows: `cd $HOME\tro-ly-zalo`) rồi nói:

| Muốn | Nói với agent |
|---|---|
| Thêm bảng tính | `Đồng bộ thêm Google Sheet này vào bộ não: <link>` |
| Giao thêm nhóm | `Giao nhóm "<tên nhóm>" cho agent chăm sóc khách hàng` |
| Agent trả lời sai, thiếu | `Agent trả lời sai câu này: <câu>. Sửa giúp tôi` |
| Đổi giọng | `Cho agent nói ngắn hơn, xưng "mình" gọi "bạn"` |
| Bật gửi thật | `Bật gửi thật cho agent chăm sóc khách hàng` |
| Thêm ảnh | `Đây là thư mục ảnh sản phẩm: <kéo thả thư mục>, chép vào bộ não để agent gửi kèm` |

Chạy trợ lý hằng ngày, ở một cửa sổ terminal riêng:

- macOS: `cd ~/tro-ly-zalo && npm start`
- Windows: `cd $HOME\tro-ly-zalo; npm.cmd start`

## Không muốn dán prompt dài? Cài skill một lần

```bash
# macOS
curl -fsSL https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/cai-skill.sh | bash
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/hoanghd218/tro-ly-zalo/main/cai-skill.ps1 | iex
```

Sau đó mở Claude Code gõ `/tro-ly-zalo`, hoặc mở Codex gõ `$tro-ly-zalo`.
