# Prompt cho buổi thực hành

Chỉ cần **một câu prompt**, không cần cài gì trước ngoài Claude Code hoặc Codex. Agent tự tải mã nguồn, tự cài Node.js nếu máy chưa có (cài riêng vào thư mục dự án, không cần mật khẩu máy), cài thư viện, đọc Bộ não số 2, hỏi bạn vài câu, chạy thử, mở mã QR Zalo, giao nhóm rồi chạy trợ lý luôn (trả lời thật ngay).

## Cách dùng

1. Mở Terminal (Windows: PowerShell).
2. Gõ `claude` (Claude Code) hoặc `codex` (Codex), Enter.
3. Copy một prompt bên dưới (nút copy ở góc phải khung), dán vào, thay phần `<...>` rồi Enter.
4. Làm theo agent: trả lời câu hỏi, bấm đồng ý khi được hỏi quyền, quét QR bằng app Zalo.

Kéo thả thư mục Bộ não số 2 từ Finder hoặc File Explorer vào khung chat là có ngay đường dẫn.

## 1. Chăm sóc khách hàng

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi là người mới: máy thiếu Node.js hay công cụ nào thì tự cài giúp tôi (Node.js cài riêng vào thư mục dự án, không cần mật khẩu máy), lệnh lỗi thì tự sửa, chỉ hỏi tôi khi thật cần.
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent chăm sóc khách hàng cho các nhóm Zalo tôi chỉ định.
```

## 2. Chăm sóc đại lý, cộng tác viên (AI Sales)

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi là người mới: máy thiếu Node.js hay công cụ nào thì tự cài giúp tôi (Node.js cài riêng vào thư mục dự án, không cần mật khẩu máy), lệnh lỗi thì tự sửa, chỉ hỏi tôi khi thật cần.
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Danh sách sản phẩm, lịch, giá của tôi ở Google Sheet: <dán link Google Sheet>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent AI Sales trong các nhóm đại lý và cộng tác viên: nhặt sản phẩm phù hợp, kiểm tra còn chỗ hay hết chỗ, trả mã sản phẩm và hoa hồng, nhận thông tin giữ chỗ như một sales thật.
```

Google Sheet cần bật Chia sẻ > "Bất kỳ ai có đường liên kết" > Người xem.

## 3. Hỗ trợ nhân viên nội bộ

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi là người mới: máy thiếu Node.js hay công cụ nào thì tự cài giúp tôi (Node.js cài riêng vào thư mục dự án, không cần mật khẩu máy), lệnh lỗi thì tự sửa, chỉ hỏi tôi khi thật cần.
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent hỗ trợ nhân viên nội bộ trong các nhóm Zalo tôi chỉ định: trả lời quy trình, nội quy, chính sách, và lập báo giá, proposal từ bảng giá nhà cung cấp.
```

## 4. Chưa có bộ não, xem thử trước

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi là người mới: máy thiếu Node.js hay công cụ nào thì tự cài giúp tôi (Node.js cài riêng vào thư mục dự án, không cần mật khẩu máy), lệnh lỗi thì tự sửa, chỉ hỏi tôi khi thật cần.
Tôi chưa có bộ não: dùng bộ não mẫu (công ty du lịch Sen Vàng) để xem thử agent trả lời thế nào trước khi nối Zalo.
```

## 5. Thực hành ngay với dữ liệu thật của VN Express Tour

Không cần bộ não riêng: dùng bảng lịch khởi hành tour ghép quốc tế của VN Express Tour có sẵn trong mã nguồn, cùng hai agent dựng sẵn (tư vấn khách lẻ, AI Sales cho đại lý và cộng tác viên).

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi là người mới: máy thiếu Node.js hay công cụ nào thì tự cài giúp tôi (Node.js cài riêng vào thư mục dự án, không cần mật khẩu máy), lệnh lỗi thì tự sửa, chỉ hỏi tôi khi thật cần.
Tôi muốn thực hành với dữ liệu thật của VN Express Tour có sẵn trong mã nguồn (npm run mau-vne): cho tôi hỏi thử agent tư vấn khách và agent AI Sales, rồi nối Zalo và chạy luôn.
```

Tin nhắn soạn sẵn để gửi học viên: [THUC-HANH-VNE.md](THUC-HANH-VNE.md).

## Sau khi cài xong

Mở Claude Code hoặc Codex trong thư mục `tro-ly-zalo` (macOS: `cd ~/tro-ly-zalo`, Windows: `cd $HOME\tro-ly-zalo`) rồi nói:

| Muốn | Nói với agent |
|---|---|
| Thêm bảng tính | `Đồng bộ thêm Google Sheet này vào bộ não: <link>` |
| Giao thêm nhóm | `Giao nhóm "<tên nhóm>" cho agent chăm sóc khách hàng` |
| Agent trả lời sai, thiếu | `Agent trả lời sai câu này: <câu>. Sửa giúp tôi` |
| Đổi giọng | `Cho agent nói ngắn hơn, xưng "mình" gọi "bạn"` |
| Thử với khách giả lập | `Giả lập khách từ dễ tính đến khó tính để test agent, rồi sửa agent theo kết quả` |
| Xem trước rồi mới gửi | `Chuyển agent chăm sóc khách hàng về nháp` |
| Tắt, bật lại trợ lý | `Tắt trợ lý` / `Chạy trợ lý` |
| Thêm ảnh | `Đây là thư mục ảnh sản phẩm: <kéo thả thư mục>, chép vào bộ não để agent gửi kèm` |

Cài xong trợ lý chạy ngầm và trả lời thật ngay, vẫn chạy khi đóng cửa sổ. Khởi động lại máy thì mở Claude Code hoặc Codex trong thư mục `tro-ly-zalo` và nói `Chạy trợ lý`.

## Không muốn dán prompt dài? Cài skill một lần

```bash
# macOS
curl -fsSL https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/cai-skill.sh | bash
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/cai-skill.ps1 | iex
```

Sau đó mở Claude Code gõ `/tro-ly-zalo`, hoặc mở Codex gõ `$tro-ly-zalo`.
