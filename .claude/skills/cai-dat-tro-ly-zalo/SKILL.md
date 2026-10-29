---
name: cai-dat-tro-ly-zalo
description: Cài Trợ lý Zalo từ đầu đến khi agent chăm sóc được các nhóm Zalo chỉ định - đọc thư mục Bộ não số 2 để hiểu doanh nghiệp, hỏi chủ doanh nghiệp những gì còn thiếu, viết vai trò agent, đồng bộ Google Sheet, chạy thử, đăng nhập Zalo bằng QR, giao nhóm. Dùng khi người dùng nói "cài đặt trợ lý Zalo", "tạo agent chăm sóc nhóm", "đọc bộ não số 2", "setup", "bắt đầu", hoặc vừa clone repo.
---

# Cài đặt Trợ lý Zalo

Bạn (Claude Code hoặc Codex) đang ở thư mục gốc của repo. Người dùng là chủ hoặc nhân viên doanh nghiệp, thường không phải lập trình viên: nói tiếng Việt, ngắn, mỗi lần một bước, báo đang ở bước nào. Bước nào đã xong ở lần trước thì bỏ qua.

**Luôn hỏi trước, không tự làm:** cài phần mềm hệ thống (Node.js), đăng nhập tài khoản (Claude, Codex, Zalo), chuyển agent sang **tự gửi**, ghi vào bộ não của người dùng.

## 1. Chuẩn bị

```bash
node -v                      # cần v20 trở lên (khuyên dùng 22)
[ -d node_modules ] || npm install
npm run kiem-tra
```

- Thiếu Node: hướng dẫn cài Node 22 LTS ở nodejs.org, chờ người dùng cài xong.
- `kiem-tra` lần đầu tự tạo `cau-hinh.yaml` từ `cau-hinh.mau.yaml`. Các dấu ✖ về tóm tắt, phiên Zalo là bình thường ở bước này.
- Claude Code hoặc Codex chưa đăng nhập: gợi ý người dùng gõ `! claude` (hoặc `! codex login`) để đăng nhập.
- `ai: tu-dong` (mặc định) tự dùng Claude Code nếu máy có, không thì dùng Codex. Model mặc định: `claude-sonnet-5-5`, `gpt-6.1-sol`.

## 2. Trỏ tới Bộ não số 2

- Người dùng đã đưa đường dẫn thư mục thì dùng; chưa có thì hỏi ("kéo thả thư mục Bộ não số 2 vào đây"). Muốn chạy thử với dữ liệu mẫu thì dùng `./bo-nao-mau` (công ty du lịch hư cấu Sen Vàng).
- Ghi đường dẫn tuyệt đối vào `bo_nao:` trong `cau-hinh.yaml`, đặt trong ngoặc kép. Trên Windows dùng dấu `/` thay cho `\`.

## 3. Đọc bộ não để hiểu doanh nghiệp

Đọc theo thứ tự (bỏ qua file không có):

1. `CLAUDE.md` hoặc `AGENTS.md` ở gốc bộ não: luật của bộ não. Tôn trọng luật đó (ví dụ chỉ ghi vào `Chờ Duyệt/`).
2. `Doanh Nghiệp.md`, `6. Company Brain OS/0. Chiến Lược & Điều Hành/Chân Dung CEO.md`, `6. Company Brain OS/0. Bản Đồ Company Brain OS.md`.
3. Toàn bộ `6. Company Brain OS/0. Chiến Lược & Điều Hành/` (nguồn sự thật về sản phẩm, giá, khách hàng, giọng).
4. `3. Sales/`, `4. Triển Khai & Chăm Sóc Khách Hàng/`, `5. Vận Hành/`, `6. Nhân Sự/` trong `6. Company Brain OS/`.
5. Bộ não không theo cấu trúc trên: liệt kê cây thư mục, đọc file Markdown, PDF, Word có tên liên quan sản phẩm, giá, chính sách, câu hỏi thường gặp, quy trình.

**Không đọc `Me.md`** (hồ sơ riêng của người chủ). Bỏ qua `.obsidian/`, thư mục mẫu (`Template`), file `.base`.

Báo lại cho người dùng tối đa 10 dòng: doanh nghiệp làm gì, bán gì, giá và chính sách chính, khách là ai; rồi liệt kê **chỗ còn thiếu** quan trọng cho việc chăm sóc (thường là: câu hỏi khách hay hỏi, chính sách cọc/huỷ, bảng giá, người phụ trách).

Bộ não gần như trống (các file ghi "Chưa điền"): đề nghị phỏng vấn nhanh theo `6. Company Brain OS/0. Bắt Đầu — Điền Hồ Sơ Doanh Nghiệp.md` (ưu tiên câu 3, 5, 7, 14, 15, 16). Được đồng ý thì ghi câu trả lời vào file đó đúng chỗ "Trả lời:", rồi làm theo mục "Biên dịch hồ sơ doanh nghiệp" trong `CLAUDE.md` của bộ não.

## 4. Hỏi chủ doanh nghiệp

Hỏi gộp một lần, đánh số, mỗi câu có gợi ý trả lời mặc định để người dùng chỉ cần gõ "ok" hoặc sửa vài chỗ:

1. Agent chăm sóc ai? Khách hàng / đại lý, cộng tác viên / nhân viên nội bộ. Có thể tạo nhiều agent, mỗi agent một nhóm đối tượng.
2. Tên agent hiển thị trong log và cách xưng hô (mặc định: xưng "em", gọi "anh/chị").
3. Agent được làm gì, tuyệt đối không được nói gì (ví dụ: không nói hoa hồng với khách lẻ, không hứa giảm giá, không xác nhận giữ chỗ).
4. Khi cần người thật (khách muốn chốt, khiếu nại, câu chưa có dữ liệu): ai phụ trách? Có nhóm Zalo quản lý để agent báo vào không?
5. Có bảng tính sản phẩm, giá, lịch, tồn kho (Google Sheet hoặc file Excel) cần agent đọc bản mới nhất không? Gửi link.
6. Trong nhóm, agent đọc mọi tin rồi tự quyết trả lời (mặc định cho nhóm khách, đại lý) hay chỉ trả lời khi được tag (mặc định cho nhóm nội bộ đông người)?

## 5. Viết agent

- `agents/tom-tat-doanh-nghiep.md`: tóm tắt doanh nghiệp tối đa 40 dòng, mọi agent đọc trong mỗi lượt trả lời. Gồm: doanh nghiệp là ai, sản phẩm chính, liên hệ và người phụ trách, giọng; và mục **"Tra cứu trong bộ não"** liệt kê đường dẫn thật (tính từ thư mục bộ não) nơi có giá, lịch, chính sách, câu hỏi thường gặp, quy trình. Xem file mẫu đang có để làm theo.
- `agents/<id>/vai-tro.md` cho từng agent: id chữ thường không dấu, nối bằng gạch ngang (ví dụ `cskh-khach-hang`). Viết theo mẫu ba agent có sẵn: đối tượng chăm sóc, danh sách việc, khi nào chuyển người thật, xưng hô, điều tuyệt đối không nói. Chỉ ghi điều có trong bộ não hoặc người dùng vừa nói.
- Ảnh: agent tự gửi kèm ảnh (jpg, png, webp) có trong bộ não khi hợp. Gợi ý người dùng để ảnh sản phẩm, tour, khách sạn vào bộ não với **tên file nói rõ nội dung** (ví dụ `2. Marketing/Thiết Kế & Hình Ảnh/Tour Nhật Bản 6N5Đ.jpg`).
- `cau-hinh.yaml`: khai báo agent trong `agents:` (id, ten, `nhom: []`, `tra_loi_khi`, `che_do: nhap`). Xoá các agent mẫu Sen Vàng và thư mục `agents/<id>` của chúng nếu người dùng không dùng bộ não mẫu.
- Có bảng tính: thêm vào `dong_bo.nguon` (ten, link, `luu_vao` là thư mục trong bộ não, ví dụ `6. Company Brain OS/1. Sản Phẩm & R&D/Danh Mục Sản Phẩm/<tên>`), chạy `npm run dong-bo`, mở một file kết quả kiểm tra đọc được. Lỗi tải Google Sheet: hướng dẫn bật Chia sẻ > "Bất kỳ ai có đường liên kết" > Người xem.
- Chạy lại `npm run kiem-tra`.

## 6. Chạy thử trước khi nối Zalo

Với từng agent, thử 3 đến 5 câu điển hình (lấy từ câu hỏi thường gặp trong bộ não hoặc người dùng đưa), một câu chào hỏi (phải IM LẶNG) và một câu chắc chắn không có trong bộ não (phải CHUYỂN NGƯỜI THẬT, không bịa):

```bash
npm run thu <id-agent> "câu hỏi"
```

Sau đó chạy giả lập cho agent chính: `npm run gia-lap <id-agent>` (AI đóng vai 5 kiểu khách, AI khác chấm điểm 0–10 và gợi ý sửa, mất vài phút). Điểm mục nào dưới 8 thì sửa `vai-tro.md` theo gợi ý và chạy lại.

Mỗi lượt mất 10–60 giây. Chép nguyên văn câu trả lời cho người dùng xem. Họ muốn chỉnh giọng hay nội dung thì sửa `vai-tro.md` (cách nói) hoặc bộ não (dữ liệu), rồi thử lại. Người dùng muốn tự trò chuyện thử: bảo họ mở terminal khác, chạy `npm run thu <id-agent>`.

## 7. Đăng nhập Zalo

Nói rõ trước khi làm: dự án dùng thư viện không chính thức zca-js cho nick Zalo cá nhân, Zalo có thể hạn chế hoặc khoá nick dùng công cụ tự động; nên dùng nick phụ. Mỗi nick chỉ chạy ở **một** máy: đăng nhập nick đang chạy ở máy khác sẽ đá phiên bên kia.

```bash
npm run dang-nhap
```

Chạy nền (hoặc chờ tối đa 5 phút). Lệnh lưu ảnh QR ở `data/qr-zalo.png` và tự mở ảnh. Nói người dùng: mở app Zalo trên điện thoại > biểu tượng QR góc trên > quét > bấm Đăng nhập. Thấy "Đăng nhập Zalo thành công" là xong.

## 8. Giao nhóm cho agent

```bash
npm run nhom                                   # danh sách nhóm và id
npm run giao <id-agent> <id-nhóm> [id-nhóm khác...]
```

Cho người dùng chọn nhóm theo tên, bạn tự tra id. Có nhóm quản lý để nhận cảnh báo thì ghi id vào `nhom_bao_cao`.

Mặc định (`mac_dinh` trong `cau-hinh.yaml`), một agent trực trả lời **mọi tin nhắn riêng 1-1** và **mọi nhóm chưa giao khi có người tag nick**. Đặt `mac_dinh.agent` là agent chăm khách vừa tạo. Người dùng không muốn thì đặt `chat_rieng: false` hoặc `nhom_khi_duoc_tag: false`.

## 9. Chạy

Bảo người dùng mở **một terminal mới** trong thư mục dự án và chạy (để trợ lý vẫn chạy khi đóng phiên này):

```bash
npm start
```

Ban đầu mọi agent ở chế độ **nháp** (`che_do: nhap`): câu trả lời chỉ in ra terminal, chưa gửi vào nhóm. Thử bằng một nick khác, hoặc từ chính điện thoại của nick này gõ `#thu <câu hỏi>` (tin của chính nick không có `#thu` được coi là nhân viên trả lời, agent nhường 30 phút). Khi người dùng hài lòng và **nói rõ** muốn bật gửi thật: đổi `che_do: tu-gui` cho agent đó trong `cau-hinh.yaml`, rồi khởi động lại (`Ctrl+C`, `npm start`).

Kết thúc bằng tóm tắt: agent nào, chăm nhóm nào, chế độ gì; câu hỏi chưa có dữ liệu được ghi vào `Chờ Duyệt/Câu hỏi agent chưa trả lời được.md` trong bộ não để bổ sung dần.
