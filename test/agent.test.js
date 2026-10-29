import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chuanHoa, layJson, loiNhacNguoiDung } from '../src/agent.js';

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
