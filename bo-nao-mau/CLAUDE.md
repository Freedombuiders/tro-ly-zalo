# CLAUDE.md — Nội quy cho AI trong bộ não này

Vault này có hai não:

- **Não của người chủ** (tầng 1–5): nơi thu nạp mọi trải nghiệm, ghi chép, bài học. Đây là đất mẹ.
- **Não doanh nghiệp** (`6. Company Brain OS/`): chỉ nhận tri thức đã chắt lọc, chia theo phòng ban. Các AI Agent làm việc trên não này.

## Thứ tự đọc

1. `Doanh Nghiệp.md`: doanh nghiệp là ai.
2. `6. Company Brain OS/0. Chiến Lược & Điều Hành/Chân Dung CEO.md`: CEO muốn gì, quyết định thế nào, muốn được báo cáo ra sao.
3. `6. Company Brain OS/0. Bản Đồ Company Brain OS.md`: phòng nào giữ việc gì.
4. `6. Company Brain OS/0. Chiến Lược & Điều Hành/`: **nguồn sự thật** về sản phẩm, giá, khách hàng, giọng thương hiệu. Không lấy những thông tin này ở bất kỳ chỗ nào khác.

## Quyền đọc `Me.md`

- `Me.md` là hồ sơ riêng của người chủ. **Agent và AI làm việc cho doanh nghiệp không đọc `Me.md`.** Thông tin về CEO mà đội cần biết thì lấy ở `Chân Dung CEO.md`.
- Chỉ AI riêng của người chủ, khi người chủ trực tiếp yêu cầu, mới được đọc `Me.md`. Ví dụ việc chắt lọc `Me.md` thành `Chân Dung CEO.md`.

## Luật ghi

- Nguyên liệu thô (tin nhắn, file, ghi âm) bỏ vào `1. Thu Thập/`. Không bê dữ liệu thô vào tầng 6.
- AI và Agent **chỉ ghi vào thư mục `Chờ Duyệt/`** của phòng mình. Người phụ trách duyệt xong mới chuyển sang thư mục chính thức.
- Thiếu dữ liệu thì nói rõ là thiếu. Không đoán, không bịa số.
- File và thư mục có tên bắt đầu bằng `0.` là hướng dẫn và bản đồ.

## Biên dịch hồ sơ doanh nghiệp

Khi người dùng nói *"Biên dịch hồ sơ doanh nghiệp vào Company Brain OS"*:

1. Đọc `6. Company Brain OS/0. Bắt Đầu — Điền Hồ Sơ Doanh Nghiệp.md`. Đây là nguyên liệu gốc: giữ nguyên, không sửa.
2. Mỗi nhóm câu trả lời ghi thành một note trong đúng thư mục bên dưới (đường dẫn tính từ `6. Company Brain OS/`). Viết lại cho gọn, rõ, đúng lời người điền. Không thêm thông tin người điền không nói. Câu nào để trống thì ghi "Chưa có dữ liệu".

| Câu | Ghi vào |
|---|---|
| 1, 2 | `0. Chiến Lược & Điều Hành/Hồ Sơ Doanh Nghiệp/` |
| 3, 15 | `0. Chiến Lược & Điều Hành/Sản Phẩm & Bảng Giá/` (giá và chính sách chỉ nằm ở đây) |
| 4, 10, 16 | `0. Chiến Lược & Điều Hành/Thương Hiệu & Giọng Nói/` |
| 5, 8 | `0. Chiến Lược & Điều Hành/Chân Dung Khách Hàng/` |
| 13 | `0. Chiến Lược & Điều Hành/Chân Dung CEO.md`, mục 4 |
| 18, 19 | `0. Chiến Lược & Điều Hành/Mục Tiêu & Chỉ Số/` |
| 6, 9 | `2. Marketing/Kế Hoạch Marketing/` |
| 7 | `3. Sales/Câu Hỏi Thường Gặp & Xử Lý Từ Chối/` |
| 14 | `3. Sales/Kịch Bản Tư Vấn/` |
| 11 | `4. Triển Khai & Chăm Sóc Khách Hàng/Phản Hồi & Đánh Giá/` |
| 12 | `4. Triển Khai & Chăm Sóc Khách Hàng/Câu Chuyện Khách Hàng/` |
| 17 | `8. Công Nghệ/Tự Động Hoá/` |
| 20 | `9. Đội Agent/` |

3. Viết `Doanh Nghiệp.md` ở gốc vault: bản tóm tắt một trang, có link tới từng note vừa tạo.
4. Báo lại cho người dùng: đã tạo những note nào, những phòng nào còn trống.

## Khi người dùng yêu cầu lưu

- Khi người dùng nói "Lưu … vào Chờ Duyệt của phòng X": tạo một note trong `6. Company Brain OS/<phòng X>/Chờ Duyệt/`, tên file nói rõ nội dung. Frontmatter ghi `trang-thai: cho-duyet` và `nguon:` liệt kê các note trong bộ não đã dùng để viết.

## Chuẩn viết SOP

Mọi SOP (quy trình chuẩn) viết theo khung sau:

1. **Tên quy trình** và **mục đích**: quy trình này giúp đạt kết quả gì.
2. **Khi nào dùng**: sự kiện nào kích hoạt quy trình.
3. **Người phụ trách** và **người duyệt**.
4. **Các bước**: viết thành bảng gồm các cột Bước · Ai làm · Làm gì · Đầu ra · Thời hạn.
5. **Checklist** kiểm tra cuối quy trình.
6. **Lỗi thường gặp** và cách xử lý.
7. **Bước nào AI làm được**: đánh dấu từng bước là Người làm / AI làm / AI làm rồi người duyệt.

Dữ liệu trong SOP (giá, chính sách, câu khách hay hỏi, giọng) chỉ lấy từ bộ não. Thiếu thì ghi "Chưa có dữ liệu", không tự đặt ra. SOP đã duyệt nằm ở `6. Company Brain OS/5. Vận Hành/Quy Trình Chuẩn (SOP)/`.
