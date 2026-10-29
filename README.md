# Trợ lý Zalo

**Một agent AI đọc "Bộ não số 2" của doanh nghiệp và chăm sóc các nhóm Zalo bạn chỉ định**: nhóm khách hàng, nhóm đại lý, cộng tác viên, hay nhóm nhân viên nội bộ. Chạy bằng **Claude Code** hoặc **Codex** ngay trên máy bạn. Không cần giao diện, không cần máy chủ: tải về, nói một câu, quét QR là dùng được.

> Dự án được chia sẻ bởi **Tony Hoang**, Freedom Builders · CAIO của **Rocket Tech Global**.

> 👉 **Prompt copy sẵn cho buổi thực hành: [PROMPT.md](PROMPT.md)** (chăm khách hàng, AI Sales cho đại lý, hỗ trợ nội bộ, xem thử với bộ não mẫu).

- Agent chỉ nói điều có trong bộ não của bạn. Không có dữ liệu thì nói thật và gọi người phụ trách, không bịa giá, không tự hứa.
- Đọc được Google Sheet hoặc file Excel (bảng giá, lịch khởi hành, tồn kho) và cập nhật mỗi 15 phút, nên luôn báo đúng giá và số chỗ còn lại.
- Nhắn như người thật: trả lời đúng câu hỏi ngay câu đầu, tách thành vài tin ngắn, hiện "đang soạn tin", gọi đúng anh/chị theo cách khách xưng. **Gửi kèm ảnh** có sẵn trong bộ não (ảnh tour, khách sạn, sản phẩm) khi hợp.
- Mặc định chỉ **soạn nháp** (in ra màn hình). Bạn xem vài hôm thấy ổn mới bật gửi thật cho từng agent.

## Bắt đầu: máy chỉ cần có Claude Code hoặc Codex

Cần sẵn: **Claude Code** (gói Claude Pro trở lên) hoặc **Codex** (gói ChatGPT Plus trở lên) đã đăng nhập, một **nick Zalo** cho agent dùng (nên là nick phụ), và thư mục **Bộ não số 2** của doanh nghiệp. Node.js, Git, thư viện: agent tự kiểm tra và cài giúp (hỏi bạn trước).

### Cách 1: dán một câu

Mở Claude Code (`claude`) hoặc Codex (`codex`) ở thư mục bất kỳ rồi dán:

```text
Tải và cài Trợ lý Zalo cho tôi: đọc rồi làm theo đúng hướng dẫn ở
https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/skills/tro-ly-zalo/SKILL.md
Bộ não số 2 của tôi ở thư mục: <kéo thả thư mục Bộ não số 2 vào đây>
Hãy đọc để hiểu toàn bộ doanh nghiệp, hỏi tôi những gì còn thiếu, rồi tạo agent chăm sóc khách hàng cho các nhóm Zalo tôi chỉ định.
```

Đổi "chăm sóc khách hàng" thành "chăm sóc đại lý và cộng tác viên" hoặc "hỗ trợ nhân viên nội bộ" tuỳ nhóm. Chưa có bộ não thì viết "dùng bộ não mẫu".

### Cách 2: cài skill một lần, sau đó chỉ gõ tên skill

Mở Terminal (Windows: PowerShell), chạy một lệnh:

```bash
# macOS, Linux
curl -fsSL https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/cai-skill.sh | bash
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/Freedombuiders/tro-ly-zalo/main/cai-skill.ps1 | iex
```

Rồi mở Claude Code gõ `/tro-ly-zalo`, hoặc mở Codex gõ `$tro-ly-zalo`.

### Agent sẽ làm gì

Tải mã nguồn về `~/tro-ly-zalo` (Windows: `C:\Users\<tên>\tro-ly-zalo`; không có Git thì tải ZIP), cài Node.js nếu thiếu, cài thư viện, đọc bộ não (bỏ qua `Me.md`), tóm tắt lại doanh nghiệp, hỏi bạn vài câu (chăm ai, xưng hô, điều không được nói, ai nhận việc khi cần người thật, có Google Sheet nào cần đọc), viết vai trò cho agent, **chạy thử vài câu hỏi cho bạn xem**, mở mã QR để bạn quét bằng Zalo, rồi giao nhóm. Cuối cùng đưa bạn lệnh chạy hằng ngày: `cd ~/tro-ly-zalo && npm start`.

Đã có mã nguồn (đã clone) thì mở Claude Code hoặc Codex ngay trong thư mục `tro-ly-zalo` và nói "cài đặt trợ lý Zalo".

## Thử ngay trong 1 phút, chưa cần Zalo

```bash
npm install
npm run thu ai-sales-dai-ly "Lệ Giang tháng 11 còn chỗ không em? Cho anh mã tour với hoa hồng"
npm run thu cskh-khach-hang "Nhà chị 2 người lớn 1 bé 8 tuổi muốn đi Nhật tháng 3, giá sao em?"
npm run thu tro-ly-noi-bo "Lên proposal Hạ Long 2N1Đ du thuyền 5 sao cho đoàn 30 khách"
npm run thu cskh-khach-hang          # trò chuyện liên tục, gõ "thoat" để dừng
```

Bộ não mẫu `bo-nao-mau/` là của công ty du lịch hư cấu **Sen Vàng**, có ba agent mẫu:

| Agent | Chăm sóc | Làm được |
|---|---|---|
| `ai-sales-dai-ly` | Nhóm đại lý, cộng tác viên | Nhặt tour theo điểm đến và tháng, kiểm tra còn chỗ hay hết chỗ, trả mã tour (CODE), hoa hồng, link lịch trình; nhận yêu cầu giữ chỗ rồi chuyển sales |
| `cskh-khach-hang` | Nhóm khách lẻ, nhóm đoàn | Tư vấn tour, báo giá bán lẻ, tính giá trẻ em, chính sách cọc/huỷ/visa; không bao giờ nhắc hoa hồng |
| `tro-ly-noi-bo` | Nhóm nhân viên | Quy trình, nội quy, nghỉ phép; **lập báo giá và proposal tour đoàn** từ bảng giá nhà cung cấp (xe, du thuyền, khách sạn, HDV, nhà hàng) |

Giá, lịch và số chỗ nằm trong hai file Excel ở `bo-nao-mau/1. Thu Thập/`, được đồng bộ thành ghi chú trong bộ não. Thay bằng link Google Sheet của bạn là agent đọc ngay sheet đó.

**Dữ liệu thật để thử:** `du-lieu-mau/VNE3 - LKH TOUR GHÉP QUỐC TẾ.xlsx` là bảng lịch khởi hành tour ghép quốc tế của **VN Express Tour** (anh Hiếu Đặng chia sẻ làm ví dụ cho buổi thực hành): hàng trăm lịch khởi hành có mã tour, giá, hoa hồng CTV, số chỗ còn lại, link lịch trình. Giá và số chỗ là ảnh chụp tại thời điểm chia sẻ, không dùng để đặt tour thật. Cách dùng: bỏ dấu `#` ở nguồn VNE trong `cau-hinh.yaml` (mục `dong_bo`, đọc thẳng Google Sheet của VNE và tải luôn hơn 500 file lịch trình Google Docs được link trong bảng), chạy `npm run dong-bo`, rồi hỏi thử agent Sales "Lệ Giang tháng 12 còn chỗ không, cho mã tour với com".

## Cách hoạt động

```
 Tin nhắn trong nhóm Zalo được giao
        │  (zca-js giữ phiên nick Zalo trên máy bạn)
        ▼
 src/bot.js ── đợi vài giây để gom tin, chọn agent theo nhóm,
        │      bỏ qua nếu nhân viên vừa trả lời bằng chính nick này
        ▼
 Claude Code / Codex, CHỈ ĐƯỢC ĐỌC, thư mục làm việc là Bộ não số 2:
   luật chung + vai trò agent + tóm tắt doanh nghiệp + 25 tin gần nhất
   → tự tìm trong bộ não (giá, lịch, chính sách...) → trả về JSON:
     trả lời | im lặng | chuyển người thật
        ▼
 Nháp: in ra màn hình.  Tự gửi: gửi vào nhóm, trích dẫn tin của khách.
 Chuyển người thật: báo vào nhóm quản lý.  Câu chưa có dữ liệu: ghi vào Chờ Duyệt của bộ não.
```

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run kiem-tra` | Kiểm tra Node, Claude Code/Codex, cấu hình, phiên Zalo |
| `npm run thu <id-agent> "câu hỏi"` | Hỏi thử agent, không cần Zalo. Bỏ câu hỏi để trò chuyện liên tục |
| `npm run dong-bo` | Đồng bộ Google Sheet / Excel vào bộ não |
| `npm run dang-nhap` | Đăng nhập Zalo bằng mã QR |
| `npm run nhom` | Danh sách nhóm Zalo và id |
| `npm run giao <id-agent> <id-nhóm>` | Giao nhóm cho agent |
| `npm start` | Chạy trợ lý. `Ctrl+C` để dừng |

## Cấu hình: `cau-hinh.yaml`

Tạo tự động từ `cau-hinh.mau.yaml` ở lần chạy đầu. Nhờ Claude Code sửa giúp, hoặc tự sửa:

```yaml
bo_nao: "/Users/ban/Documents/Bộ não số 2"   # thư mục bộ não
ai: tu-dong                                  # tu-dong | claude | codex
model:
  claude: claude-sonnet-5-5                  # claude-haiku-5-5 nếu muốn nhanh, rẻ hơn
  codex: gpt-6.1-sol
nhom_bao_cao: "1234567890"                   # nhóm quản lý nhận cảnh báo (tuỳ chọn)
mac_dinh:                                    # agent trực mặc định
  agent: cskh-khach-hang
  chat_rieng: true                           # trả lời mọi tin nhắn riêng 1-1
  nhom_khi_duoc_tag: true                    # nhóm chưa giao: trả lời khi có người tag nick
  che_do: nhap                               # nhap | tu-gui cho các tin đi theo mặc định
  che_do_nhom: tu-gui                        # riêng cho nhóm khi được tag (không ghi thì theo che_do)
agents:
  - id: cskh-khach-hang                      # vai trò ở agents/cskh-khach-hang/vai-tro.md
    ten: Chăm sóc khách hàng
    nhom: ["1234567890"]                     # id nhóm (npm run nhom) hoặc id người tin riêng
    tra_loi_khi: moi-tin                     # moi-tin | khi-duoc-goi (chỉ khi được tag)
    che_do: nhap                             # nhap (chỉ in ra) | tu-gui (gửi thật)
dong_bo:
  moi_phut: 15
  nguon:
    - ten: Bảng giá
      link: https://docs.google.com/spreadsheets/d/.../edit
      luu_vao: 6. Company Brain OS/1. Sản Phẩm & R&D/Danh Mục Sản Phẩm/Bảng giá
      tai_lich_trinh: true                   # tải cả các Google Docs được link trong bảng (lịch trình)
```

Agent hiểu doanh nghiệp qua ba lớp: `src/luat-chung.md` (luật chung, giống nhau mọi doanh nghiệp), `agents/tom-tat-doanh-nghiep.md` (tóm tắt bộ não, Claude Code viết lúc cài) và `agents/<id>/vai-tro.md` (vai trò từng agent). Sửa ba file này bằng tiếng Việt thường là đổi được cách agent làm việc.

## An toàn

- Mặc định **nháp**: không gửi gì cho đến khi bạn đổi `che_do: tu-gui`.
- Mặc định agent trực trả lời **mọi tin nhắn riêng 1-1** và, ở các nhóm chưa giao cho agent nào, **chỉ khi có người tag nick**. Nhóm đã giao thì theo `tra_loi_khi` của agent đó.
- Tự thử từ chính điện thoại của nick: gõ `#thu <câu hỏi>` vào nhóm hoặc tin riêng, agent coi như khách hỏi.
- Agent chỉ được **đọc** bộ não: không sửa file, không lên mạng. Không đọc `Me.md` (hồ sơ riêng của chủ).
- Nhân viên vừa nhắn bằng chính nick Zalo đó thì agent **nhường 30 phút** trong nhóm ấy.
- Tối đa 60 tin trả lời mỗi giờ. Khách thấy bong bóng "đang soạn tin" trong lúc agent tra cứu (tin riêng, hoặc khi được tag) và độ trễ như người thật.
- Câu khách hỏi mà bộ não chưa có được ghi vào `Chờ Duyệt/Câu hỏi agent chưa trả lời được.md` trong bộ não để bạn bổ sung.
- Phiên Zalo và lịch sử tin nhắn chỉ nằm trong thư mục `data/` trên máy bạn.

> **Cảnh báo.** Kết nối Zalo dùng thư viện không chính thức [`zca-js`](https://github.com/RFS-ADRENO/zca-js) cho nick Zalo cá nhân. Zalo có thể giới hạn hoặc khoá nick dùng công cụ tự động. Bạn tự chịu trách nhiệm về tài khoản của mình, về điều khoản của Zalo và luật bảo vệ dữ liệu cá nhân. Nên dùng nick phụ. **Mỗi nick chỉ chạy ở một máy**: đăng nhập cùng nick ở hai nơi sẽ đá phiên nhau.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `Không tìm thấy lệnh "claude"` | Cài Claude Code (`npm install -g @anthropic-ai/claude-code`), mở lại Terminal |
| Windows báo `npm.ps1 cannot be loaded` | Chạy trong PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, hoặc dùng Command Prompt |
| `Không tải được Google Sheet` | Google Sheet > Chia sẻ > "Bất kỳ ai có đường liên kết" > Người xem |
| Mã QR hết hạn | Chạy lại `npm run dang-nhap`, quét trong vòng 1 phút |
| `Không đăng nhập lại được bằng phiên đã lưu` | Phiên hết hạn hoặc nick đăng nhập ở máy khác: `npm run dang-nhap` |
| Agent trả lời sai giá | Sửa trong bộ não hoặc Google Sheet (agent luôn đọc bản mới nhất), không sửa trong code |
| Agent trả lời chậm (20–60 giây) | Bình thường khi phải tra nhiều file. Muốn nhanh hơn: `claude: claude-haiku-5-5` trong `model` |

## Giấy phép

MIT, © 2026 Tony Hoang (xem [LICENSE](LICENSE)). Dùng thư viện [`zca-js`](https://github.com/RFS-ADRENO/zca-js) (MIT), [`exceljs`](https://github.com/exceljs/exceljs) (MIT), [`yaml`](https://github.com/eemeli/yaml) (ISC). Claude Code (Anthropic) và Codex (OpenAI) không đi kèm: bạn tự cài và dùng theo điều khoản của từng nhà cung cấp. Dữ liệu trong `bo-nao-mau/` là hư cấu. File trong `du-lieu-mau/` thuộc VN Express Tour, được chia sẻ làm ví dụ cho buổi thực hành.
