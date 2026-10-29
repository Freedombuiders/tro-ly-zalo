import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chuanHoa, dsAnh, layJson, loiNhacNguoiDung } from '../src/agent.js';

test('đọc JSON trần, trong khối code, hoặc ở cuối câu chữ', () => {
  const o = { hanh_dong: 'tra_loi', tin_nhan: 'Dạ {còn} 6 chỗ', ly_do: '', cau_hoi_thieu_du_lieu: '' };
  assert.deepEqual(layJson(JSON.stringify(o)), o);
  assert.deepEqual(layJson(`Đây:\n\`\`\`json\n${JSON.stringify(o)}\n\`\`\``), o);
  assert.deepEqual(layJson(`Mình đã tra {bảng}. ${JSON.stringify(o)}`), o);
  assert.throws(() => layJson('không có gì {'), /Không đọc được JSON/);
});

test('chuẩn hoá: trả lời rỗng thành im lặng, hành động lạ thành im lặng', () => {
  assert.equal(chuanHoa({ hanh_dong: 'tra_loi', tin_nhan: '  ' }).hanh_dong, 'bo_qua');
  assert.equal(chuanHoa({ hanh_dong: 'gui_ngay', tin_nhan: 'x' }).hanh_dong, 'bo_qua');
  assert.equal(chuanHoa({ hanh_dong: 'chuyen_nguoi', tin_nhan: '' }).hanh_dong, 'chuyen_nguoi');
});

test('lời nhắc có nơi trò chuyện, lịch sử và tin mới', () => {
  const ts = Date.UTC(2026, 9, 30, 2, 5);
  const s = loiNhacNguoiDung({ ten: 'Trợ lý' }, {
    noiChat: 'nhóm Zalo "Đại lý"',
    lichSu: [{ ts, ten: 'Lan', noi_dung: 'chào em', la_bot: false }, { ts, ten: 'Trợ lý', noi_dung: 'Dạ chào chị', la_bot: true }],
    tinMoi: [{ ts, ten: 'Lan', noi_dung: 'tour Nhật còn chỗ?' }],
  });
  assert.match(s, /nhóm Zalo "Đại lý"/);
  assert.match(s, /\[09:05\] Lan: chào em/);
  assert.match(s, /\[09:05\] Bạn: Dạ chào chị/);
  assert.match(s, /Tin mới cần xem xét:\n\[09:05\] Lan: tour Nhật còn chỗ\?/);
});

test('ảnh: chỉ giữ đuôi ảnh, tối đa 3; liệt kê ảnh trong bộ não bỏ thư mục ẩn và mẫu', () => {
  assert.deepEqual(chuanHoa({ hanh_dong: 'tra_loi', tin_nhan: 'x', anh: ['a.jpg', 'b.md', 'c.png', 'd.webp', 'e.jpeg'] }).anh, ['a.jpg', 'c.png', 'd.webp']);
  const goc = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-anh-'));
  for (const d of ['Ảnh tour', '.obsidian', 'Template']) fs.mkdirSync(path.join(goc, d));
  fs.writeFileSync(path.join(goc, 'Ảnh tour', 'Nhật.jpg'), 'x');
  fs.writeFileSync(path.join(goc, '.obsidian', 'icon.png'), 'x');
  fs.writeFileSync(path.join(goc, 'Template', 'mau.png'), 'x');
  fs.writeFileSync(path.join(goc, 'ghi-chu.md'), 'x');
  assert.deepEqual(dsAnh(goc), ['Ảnh tour/Nhật.jpg']);
  assert.match(loiNhacNguoiDung({ ten: 'A' }, { noiChat: 'x', tinMoi: [{ ts: 0, ten: 'K', noi_dung: 'q' }], anhCoSan: ['Ảnh tour/Nhật.jpg'] }), /Ảnh có sẵn[\s\S]*- Ảnh tour\/Nhật\.jpg/);
});
