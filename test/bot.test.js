import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

process.env.TRO_LY_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'tro-ly-zalo-'));
const { chayBot, CHO_GOM_TIN_MS, CHO_NOI_LAI_GIAY, tachBongBong, anhHopLe } = await import('../src/bot.js');
const { ThreadType } = await import('zca-js');
CHO_GOM_TIN_MS.nhom = 20;
CHO_GOM_TIN_MS.rieng = 20;

const doi = (ms) => new Promise((r) => setTimeout(r, ms));
let dem = 0;

function zaloGia() {
  const listener = new EventEmitter();
  listener.start = () => {};
  return {
    listener,
    getOwnId: async () => 'TOI',
    getGroupInfo: async (id) => ({ gridInfoMap: { [id]: { name: `Nhóm ${id}` } } }),
    dangSoan: [],
    async sendTypingEvent(threadId) { this.dangSoan.push(threadId); },
  };
}

const tinNhom = (threadId, content, { data = {}, ...ngoai } = {}) => ({
  type: ThreadType.Group, threadId, isSelf: false,
  data: { msgId: String(++dem), ts: String(Date.now()), dName: 'Khách A', content, ...data },
  ...ngoai,
});

const agentMau = (o = {}) => ({ id: 'a', ten: 'Agent A', nhom: ['G1'], tra_loi_khi: 'moi-tin', che_do: 'tu-gui', ai: 'claude', model: '', ...o });
const KHONG_MAC_DINH = { agent: '', chat_rieng: false, nhom_khi_duoc_tag: false };
const cauHinh = (agents, o = {}) => ({ bo_nao: os.tmpdir(), nhom_bao_cao: '', mac_dinh: KHONG_MAC_DINH, dong_bo: { nguon: [], moi_phut: 0 }, agents, ...o });

async function khoiDong(ch, traLoi = { hanh_dong: 'tra_loi', tin_nhan: 'Dạ em trả lời', ly_do: '', cau_hoi_thieu_du_lieu: '' }) {
  const api = zaloGia();
  const hoi = [];
  const gui = [];
  const anh = [];
  await chayBot(ch, {
    guiAnhZalo: async (_api, threadId, _loai, files) => { anh.push({ threadId, files }); },
    api,
    log: () => {},
    hoi: async (x) => { hoi.push(x); return { ...traLoi, giay: 0 }; },
    guiZalo: async (_api, threadId, loai, text, quote) => {
      gui.push({ threadId, loai, text, quote });
      // Zalo vọng lại tin chính nick vừa gửi
      api.listener.emit('message', { type: loai, threadId, isSelf: true, data: { msgId: String(++dem), ts: String(Date.now()), content: text } });
    },
  });
  return { api, hoi, gui, anh };
}

test('gom nhiều tin liền nhau thành một lượt, trả lời có trích dẫn tin cuối', async () => {
  const { api, hoi, gui } = await khoiDong(cauHinh([agentMau()]));
  api.listener.emit('message', tinNhom('G1', 'Tour Nhật'));
  const cuoi = tinNhom('G1', 'còn chỗ không?');
  api.listener.emit('message', cuoi);
  await doi(120);
  assert.equal(hoi.length, 1);
  assert.deepEqual(hoi[0].tinhHuong.tinMoi.map((t) => t.noi_dung), ['Tour Nhật', 'còn chỗ không?']);
  assert.match(hoi[0].tinhHuong.noiChat, /Nhóm G1/);
  assert.equal(gui.length, 1);
  assert.equal(gui[0].quote, cuoi.data);
});

test('nhóm chưa giao cho agent nào thì bỏ qua', async () => {
  const { api, hoi } = await khoiDong(cauHinh([agentMau()]));
  api.listener.emit('message', tinNhom('G-khac', 'xin chào'));
  await doi(80);
  assert.equal(hoi.length, 0);
});

test('khi-duoc-goi: chỉ chạy khi được tag hoặc có người trả lời vào tin của agent', async () => {
  const { api, hoi } = await khoiDong(cauHinh([agentMau({ tra_loi_khi: 'khi-duoc-goi' })]));
  api.listener.emit('message', tinNhom('G1', 'mọi người ơi'));
  await doi(80);
  assert.equal(hoi.length, 0);
  api.listener.emit('message', tinNhom('G1', '@Trợ lý cho hỏi', { data: { mentions: [{ uid: 'TOI', pos: 0, len: 7, type: 0 }] } }));
  await doi(80);
  assert.equal(hoi.length, 1);
  api.listener.emit('message', tinNhom('G1', 'thế còn tháng 12?', { data: { quote: { ownerId: 'TOI' } } }));
  await doi(80);
  assert.equal(hoi.length, 2);
  // tin không gọi agent vẫn nằm trong lịch sử để agent hiểu ngữ cảnh
  assert.ok(hoi[0].tinhHuong.lichSu.some((t) => t.noi_dung === 'mọi người ơi'));
});

test('chế độ nháp: hỏi agent nhưng không gửi', async () => {
  const { api, hoi, gui } = await khoiDong(cauHinh([agentMau({ che_do: 'nhap' })]));
  api.listener.emit('message', tinNhom('G1', 'giá tour?'));
  await doi(80);
  assert.equal(hoi.length, 1);
  assert.equal(gui.length, 0);
});

test('nhân viên nhắn bằng chính nick: agent nhường, tin vọng của bot thì không tính', async () => {
  const { api, hoi, gui } = await khoiDong(cauHinh([agentMau({ nhom: ['G1', 'G2'] })]));
  api.listener.emit('message', tinNhom('G1', 'hỏi lần 1'));
  await doi(80);
  assert.equal(gui.length, 1);
  api.listener.emit('message', tinNhom('G1', 'hỏi lần 2'));
  await doi(80);
  assert.equal(hoi.length, 2, 'tin vọng của bot không làm agent nhường');

  api.listener.emit('message', { type: ThreadType.Group, threadId: 'G2', isSelf: true, data: { msgId: 'nv', ts: String(Date.now()), content: 'Để chị trả lời nhé' } });
  api.listener.emit('message', tinNhom('G2', 'vâng ạ'));
  await doi(80);
  assert.equal(hoi.length, 2, 'nhân viên vừa nhắn thì agent im');
});

test('chuyển người thật: báo vào nhóm quản lý', async () => {
  const { api, gui } = await khoiDong(
    cauHinh([agentMau()], { nhom_bao_cao: 'QL' }),
    { hanh_dong: 'chuyen_nguoi', tin_nhan: 'Dạ em báo sales ngay ạ', ly_do: 'Khách muốn giữ chỗ LG6-1121', cau_hoi_thieu_du_lieu: '' },
  );
  api.listener.emit('message', tinNhom('G1', 'giữ cho anh 2 chỗ LG6-1121'));
  await doi(120);
  assert.deepEqual(gui.map((g) => g.threadId), ['G1', 'QL']);
  assert.match(gui[1].text, /LG6-1121/);
});

test('tin riêng 1-1 chỉ trả lời khi bật mac_dinh.chat_rieng', async () => {
  const tinRieng = { type: ThreadType.User, threadId: 'U1', isSelf: false, data: { msgId: 'r1', ts: String(Date.now()), dName: 'Lan', content: 'alo' } };
  const khong = await khoiDong(cauHinh([agentMau()]));
  khong.api.listener.emit('message', tinRieng);
  await doi(80);
  assert.equal(khong.hoi.length, 0);

  const co = await khoiDong(cauHinh([agentMau()], { mac_dinh: { agent: 'a', chat_rieng: true, nhom_khi_duoc_tag: false, che_do: 'tu-gui' } }));
  co.api.listener.emit('message', { ...tinRieng, data: { ...tinRieng.data, msgId: 'r2' } });
  await doi(80);
  assert.equal(co.hoi.length, 1);
  assert.equal(co.gui[0].quote, undefined);
});

test('#thu từ chính nick: đóng vai khách, không làm agent nhường', async () => {
  const { api, hoi } = await khoiDong(cauHinh([agentMau({ tra_loi_khi: 'khi-duoc-goi', che_do: 'nhap' })]));
  api.listener.emit('message', { type: ThreadType.Group, threadId: 'G1', isSelf: true, data: { msgId: 'nv1', ts: String(Date.now()), content: 'chào cả nhà' } });
  api.listener.emit('message', { type: ThreadType.Group, threadId: 'G1', isSelf: true, data: { msgId: 'nv2', ts: String(Date.now()), content: '#thu Lệ Giang tháng 11 còn chỗ không?' } });
  await doi(80);
  assert.equal(hoi.length, 1);
  assert.deepEqual(hoi[0].tinhHuong.tinMoi.map((t) => [t.ten, t.noi_dung]), [['Khách (thử)', 'Lệ Giang tháng 11 còn chỗ không?']]);
});

test('nhóm chưa giao: agent mặc định chỉ trả lời khi được tag', async () => {
  const { api, hoi } = await khoiDong(cauHinh([agentMau({ nhom: [] })], { mac_dinh: { agent: 'a', chat_rieng: true, nhom_khi_duoc_tag: true } }));
  api.listener.emit('message', tinNhom('G9', 'chuyện riêng của nhóm'));
  await doi(80);
  assert.equal(hoi.length, 0);
  api.listener.emit('message', tinNhom('G9', '@nick tour Thái còn chỗ?', { data: { mentions: [{ uid: 'TOI', pos: 0, len: 5, type: 0 }] } }));
  await doi(80);
  assert.equal(hoi.length, 1);
  assert.ok(hoi[0].tinhHuong.lichSu.some((t) => t.noi_dung === 'chuyện riêng của nhóm'), 'vẫn có ngữ cảnh nhóm');
});

test('đang soạn tin: hiện khi tự gửi và được tag hoặc tin riêng, không hiện ở chế độ nháp', async () => {
  const tuGui = await khoiDong(cauHinh([agentMau()], { mac_dinh: { agent: 'a', chat_rieng: true, nhom_khi_duoc_tag: true, che_do: 'tu-gui' } }));
  tuGui.api.listener.emit('message', { type: ThreadType.User, threadId: 'U5', isSelf: false, data: { msgId: 'u5', ts: String(Date.now()), dName: 'Lan', content: 'alo' } });
  tuGui.api.listener.emit('message', tinNhom('G1', 'nói chuyện thường'));
  await doi(100);
  assert.deepEqual(tuGui.api.dangSoan, ['U5']);

  const nhap = await khoiDong(cauHinh([agentMau({ che_do: 'nhap' })], { mac_dinh: { agent: 'a', chat_rieng: true, nhom_khi_duoc_tag: true } }));
  nhap.api.listener.emit('message', { type: ThreadType.User, threadId: 'U6', isSelf: false, data: { msgId: 'u6', ts: String(Date.now()), dName: 'Lan', content: 'alo' } });
  await doi(100);
  assert.deepEqual(nhap.api.dangSoan, []);
});

test('người được giao rõ theo chế độ của agent, tin riêng khác theo chế độ mặc định', async () => {
  const { api, hoi, gui } = await khoiDong(cauHinh(
    [agentMau({ nhom: ['U-test'], che_do: 'tu-gui' })],
    { mac_dinh: { agent: 'a', chat_rieng: true, nhom_khi_duoc_tag: true, che_do: 'nhap' } },
  ));
  const rieng = (threadId) => ({ type: ThreadType.User, threadId, isSelf: false, data: { msgId: `m-${threadId}`, ts: String(Date.now()), dName: 'X', content: 'alo' } });
  api.listener.emit('message', rieng('U-test'));
  api.listener.emit('message', rieng('U-khac'));
  await doi(120);
  assert.equal(hoi.length, 2);
  assert.deepEqual(gui.map((g) => g.threadId), ['U-test']);
});

test('tách câu trả lời thành tối đa 3 tin theo dòng trống', () => {
  assert.deepEqual(tachBongBong('Còn anh ạ.'), ['Còn anh ạ.']);
  assert.deepEqual(tachBongBong('A\n\nB\n- dòng 1\n- dòng 2\n\n\nC'), ['A', 'B\n- dòng 1\n- dòng 2', 'C']);
  assert.deepEqual(tachBongBong('1\n\n2\n\n3\n\n4'), ['1', '2', '3\n\n4']);
});

test('chỉ gửi ảnh có thật nằm trong bộ não', () => {
  const goc = fs.mkdtempSync(path.join(os.tmpdir(), 'anh-'));
  fs.mkdirSync(path.join(goc, 'Ảnh'));
  fs.writeFileSync(path.join(goc, 'Ảnh', 'Tour Nhật.jpg'), 'x');
  fs.writeFileSync(path.join(os.tmpdir(), 'ngoai.jpg'), 'x');
  const ok = anhHopLe(goc, ['Ảnh/Tour Nhật.jpg', 'Ảnh/khong-co.jpg', '../ngoai.jpg', 'Me.md']);
  assert.deepEqual(ok, [path.join(goc, 'Ảnh', 'Tour Nhật.jpg')]);
});

test('trả lời nhiều tin: trích dẫn tin khách ở tin đầu, gửi ảnh sau cùng', async () => {
  const goc = fs.mkdtempSync(path.join(os.tmpdir(), 'bo-nao-'));
  fs.writeFileSync(path.join(goc, 'tour.jpg'), 'x');
  const { api, gui, anh, hoi } = await khoiDong(
    cauHinh([agentMau()], { bo_nao: goc }),
    { hanh_dong: 'tra_loi', tin_nhan: 'Còn anh ạ.\n\nNgày 21/11 còn 6 chỗ.', ly_do: '', cau_hoi_thieu_du_lieu: '', anh: ['tour.jpg', '../x.jpg'] },
  );
  const tin = tinNhom('G1', 'Lệ Giang còn chỗ không?');
  api.listener.emit('message', tin);
  await doi(150);
  assert.deepEqual(gui.map((g) => g.text), ['Còn anh ạ.', 'Ngày 21/11 còn 6 chỗ.']);
  assert.equal(gui[0].quote, tin.data);
  assert.equal(gui[1].quote, undefined);
  assert.deepEqual(anh, [{ threadId: 'G1', files: [path.join(goc, 'tour.jpg')] }]);
  // hai tin vọng lại của bot không làm agent nhường
  api.listener.emit('message', tinNhom('G1', 'thế tháng 12?'));
  await doi(150);
  assert.equal(hoi.length, 2);
});

test('mac_dinh.che_do_nhom: gửi thật ở nhóm khi được tag, tin riêng người lạ vẫn nháp', async () => {
  const { api, gui, hoi } = await khoiDong(cauHinh([agentMau({ nhom: [] })], {
    mac_dinh: { agent: 'a', chat_rieng: true, nhom_khi_duoc_tag: true, che_do: 'nhap', che_do_nhom: 'tu-gui' },
  }));
  api.listener.emit('message', tinNhom('G7', '@nick e ui', { data: { mentions: [{ uid: 'TOI', pos: 0, len: 5, type: 0 }] } }));
  api.listener.emit('message', { type: ThreadType.User, threadId: 'U9', isSelf: false, data: { msgId: 'u9', ts: String(Date.now()), dName: 'Lạ', content: 'alo' } });
  await doi(150);
  assert.equal(hoi.length, 2);
  assert.deepEqual(gui.map((g) => g.threadId), ['G7']);
});

test('mất kết nối thì tự nối lại, nick mở ở nơi khác thì dừng', async () => {
  CHO_NOI_LAI_GIAY.splice(0, CHO_NOI_LAI_GIAY.length, 0.01);
  const api = zaloGia();
  let lanStart = 0;
  api.listener.start = () => { lanStart++; };
  const nhatKy = [];
  await chayBot(cauHinh([agentMau()]), { api, log: (s) => nhatKy.push(s), hoi: async () => ({}), guiZalo: async () => {}, guiAnhZalo: async () => {} });
  assert.equal(lanStart, 1);
  api.listener.emit('closed', 1006, '');
  await doi(60);
  assert.equal(lanStart, 2);
  api.listener.emit('connected');
  assert.match(nhatKy.at(-1), /Đã kết nối lại/);
  api.listener.emit('closed', 3000, '');
  await doi(60);
  assert.equal(lanStart, 2);
  assert.match(nhatKy.at(-1), /nơi khác/);
  process.exitCode = 0;
});
