# Thực hành: trợ lý Zalo tư vấn tour

Dùng dữ liệu thật của VN Express Tour: lịch khởi hành, giá, số chỗ và hơn 500 lịch trình tour ghép quốc tế. Mất khoảng 10–15 phút.

**Chuẩn bị:** máy tính đã cài và đăng nhập Claude Code hoặc Codex, điện thoại có Zalo. Nên dùng nick Zalo phụ, vì trợ lý sẽ trả lời mọi tin nhắn riêng gửi tới nick này.

## Bước 1. Dán prompt

Mở Terminal (Windows: PowerShell), gõ `claude` (hoặc `codex`), Enter. Dán nguyên đoạn dưới rồi Enter:

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Tôi là người mới: máy thiếu Node.js hay công cụ nào thì tự cài giúp tôi (Node.js cài riêng vào thư mục dự án, không cần mật khẩu máy), lệnh lỗi thì tự sửa, chỉ hỏi tôi khi thật cần.
Tôi muốn thực hành với dữ liệu thật của VN Express Tour có sẵn trong mã nguồn (npm run mau-vne): cho tôi hỏi thử agent tư vấn khách và agent AI Sales, rồi nối Zalo và chạy luôn.
```

## Bước 2. Đồng ý khi được hỏi

Agent xin quyền chạy lệnh thì chọn Đồng ý. Máy chưa có Node.js hay Git cũng không sao: agent tự lo, không cần mật khẩu máy, bạn không phải cài gì thêm.

## Bước 3. Hỏi thử

Agent cho hỏi thử ngay trong cửa sổ. Ví dụ: "4 người đi Quảng Châu tháng 12 hết bao nhiêu?"

## Bước 4. Quét QR

Ảnh mã QR tự mở. Mở Zalo trên điện thoại > biểu tượng QR > quét > Đăng nhập.

## Bước 5. Trợ lý chạy luôn

Quét xong là trợ lý chạy và trả lời thật trên Zalo, kể cả khi bạn đóng cửa sổ Claude Code.

Nhờ người ngồi cạnh nhắn tin hỏi tour cho nick của bạn, hoặc tự nhắn từ điện thoại: `#thu <câu hỏi>`. Trong nhóm Zalo, tag nick của bạn để trợ lý trả lời.

## Muốn đổi gì thì nói với agent

| Muốn | Nói |
|---|---|
| Tắt trợ lý | `Tắt trợ lý` |
| Bật lại (sau khi tắt hoặc khởi động lại máy) | `Chạy trợ lý` |
| Chỉ soạn nháp, chưa gửi thật | `Chuyển trợ lý về nháp` |
| Trợ lý vừa trả lời những gì | `Trợ lý vừa trả lời những tin nào?` |
| Giao một nhóm cho AI Sales | `Giao nhóm "<tên nhóm>" cho agent AI Sales` |

Khi bạn tự trả lời khách bằng chính nick này, trợ lý tự nhường và im lặng 30 phút trong cuộc trò chuyện đó.

Hướng dẫn đầy đủ: https://github.com/Freedombuiders/tro-ly-zalo/blob/main/PROMPT.md
