import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

process.env.TRO_LY_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'tro-ly-zalo-'));
const { chayBot, CHO_GOM_TIN_MS } = await import('../src/bot.js');
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
  };
}

const tinNhom = (threadId, content, { data = {}, ...ngoai } = {}) => ({
  type: ThreadType.Group, threadId, isSelf: false,
  data: { msgId: String(++dem), ts: String(Date.now()), dName: 'Khách A', content, ...data },
  ...ngoai,
});

const agentMau = (o = {}) => ({ id: 'a', ten: 'Agent A', nhom: ['G1'], tra_loi_khi: 'moi-tin', che_do: 'tu-gui', ai: 'claude', model: '', ...o });
const cauHinh = (agents, o = {}) => ({ bo_nao: os.tmpdir(), nhom_bao_cao: '', chat_rieng: '', dong_bo: { nguon: [], moi_phut: 0 }, agents, ...o });

async function khoiDong(ch, traLoi = { hanh_dong: 'tra_loi', tin_nhan: 'Dạ em trả lời', ly_do: '', cau_hoi_thieu_du_lieu: '' }) {
  const api = zaloGia();
  const hoi = [];
  const gui = [];
  await chayBot(ch, {
    api,
    log: () => {},
    hoi: async (x) => { hoi.push(x); return { ...traLoi, giay: 0 }; },
    guiZalo: async (_api, threadId, loai, text, quote) => {
      gui.push({ threadId, loai, text, quote });
      // Zalo vọng lại tin chính nick vừa gửi
      api.listener.emit('message', { type: loai, threadId, isSelf: true, data: { msgId: String(++dem), ts: String(Date.now()), content: text } });
    },
  });
  return { api, hoi, gui };
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

test('tin riêng 1-1 chỉ trả lời khi có chat_rieng', async () => {
  const tinRieng = { type: ThreadType.User, threadId: 'U1', isSelf: false, data: { msgId: 'r1', ts: String(Date.now()), dName: 'Lan', content: 'alo' } };
  const khong = await khoiDong(cauHinh([agentMau()]));
  khong.api.listener.emit('message', tinRieng);
  await doi(80);
  assert.equal(khong.hoi.length, 0);

  const co = await khoiDong(cauHinh([agentMau()], { chat_rieng: 'a' }));
  co.api.listener.emit('message', { ...tinRieng, data: { ...tinRieng.data, msgId: 'r2' } });
  await doi(80);
  assert.equal(co.hoi.length, 1);
  assert.equal(co.gui[0].quote, undefined);
});
