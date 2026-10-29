# SOP giữ chỗ và xác nhận booking

1. **Tên quy trình**: giữ chỗ và xác nhận booking tour ghép. **Mục đích**: không bán trùng chỗ, đại lý được trả lời trong 30 phút.
2. **Khi nào dùng**: khách lẻ hoặc đại lý gửi yêu cầu giữ chỗ (mã tour + số khách + tên theo hộ chiếu).
3. **Người phụ trách**: sales trực nhóm. **Người duyệt**: trưởng phòng điều hành (anh Long).

| Bước | Ai làm | Làm gì | Đầu ra | Thời hạn |
|---|---|---|---|---|
| 1 | AI làm | Kiểm tra chỗ còn trong bảng lịch khởi hành, báo lại khách | Tin trả lời | Ngay |
| 2 | Sales | Giữ chỗ trên bảng tính điều hành, ghi mã đại lý | Chỗ được giữ | 30 phút |
| 3 | Sales | Gửi thông tin chuyển khoản cọc | Tin nhắn | 30 phút |
| 4 | Kế toán | Xác nhận đã nhận cọc | Phiếu thu | 2 giờ |
| 5 | Sales | Gửi phiếu xác nhận dịch vụ, nhắc giấy tờ | Phiếu xác nhận | Trong ngày |
| 6 | Điều hành | Cập nhật số chỗ còn lại trên Google Sheet | Bảng giá mới | Trong ngày |

**Checklist**: đúng mã tour, đúng ngày, tên khớp hộ chiếu, đã ghi mã đại lý, đã cọc trong 24 giờ.

**Lỗi thường gặp**: tên sai chính tả so với hộ chiếu (sửa trước khi nộp visa); giữ chỗ quá 24 giờ chưa cọc (huỷ, báo đại lý).

**Bước nào AI làm được**: bước 1 AI làm. Bước 2–6 người làm.
