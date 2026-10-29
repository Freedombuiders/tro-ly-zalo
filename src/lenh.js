#!/usr/bin/env node
// Lệnh dòng: chay | dang-nhap | nhom | giao | thu | dong-bo | kiem-tra
import fs from 'node:fs';
import readline from 'node:readline/promises';
import YAML from 'yaml';
import { FILE_CAU_HINH, FILE_TOM_TAT, docCauHinh, fileVaiTro, kiemTraCauHinh, timAgent } from './cau-hinh.js';
import { chayLenh, hoiAgent } from './agent.js';
import { chayBot, gio } from './bot.js';
import { dongBoTatCa } from './dong-bo.js';
import { coPhien, dangNhapQR, ketNoi, layNhom } from './zalo.js';

const [lenh, ...thamSo] = process.argv.slice(2);

function layCo(ten) {
  const i = thamSo.indexOf(`--${ten}`);
  if (i < 0) return undefined;
  const v = thamSo[i + 1];
  thamSo.splice(i, 2);
  return v;
}

async function kiemTra() {
  const ch = docCauHinh();
  let ok = true;
  const dong = (dat, chu, goiY) => {
    console.log(`${dat ? '✔' : '✖'} ${chu}${!dat && goiY ? `\n    → ${goiY}` : ''}`);
    if (!dat) ok = false;
  };
  const [major] = process.versions.node.split('.').map(Number);
  dong(major >= 20, `Node.js ${process.versions.node}`, 'Cài Node.js 22 trở lên: https://nodejs.org');
  dong(fs.existsSync(ch.bo_nao), `Bộ não: ${ch.bo_nao}`, 'Sửa bo_nao trong cau-hinh.yaml');
  for (const ai of new Set(ch.agents.map((a) => a.ai))) {
    try {
      const v = await chayLenh(ai, ['--version'], { cwd: process.cwd(), timeoutMs: 20_000 });
      dong(true, `${ai === 'codex' ? 'Codex' : 'Claude Code'}: ${v.trim()}`);
    } catch (err) {
      dong(false, `${ai === 'codex' ? 'Codex' : 'Claude Code'}: ${err.message}`,
        ai === 'codex' ? 'npm i -g @openai/codex rồi chạy codex để đăng nhập' : 'npm i -g @anthropic-ai/claude-code rồi chạy claude để đăng nhập');
    }
  }
  dong(fs.existsSync(FILE_TOM_TAT), 'Tóm tắt doanh nghiệp: agents/tom-tat-doanh-nghiep.md', 'Nhờ Claude Code / Codex: "cài đặt trợ lý Zalo" để đọc bộ não và viết file này');
  for (const a of ch.agents) {
    dong(fs.existsSync(fileVaiTro(a.id)), `Agent ${a.id} (${a.ten}): ${a.nhom.length} nhóm, ${a.tra_loi_khi}, ${a.che_do === 'tu-gui' ? 'TỰ GỬI' : 'nháp'}`, `Tạo agents/${a.id}/vai-tro.md`);
  }
  for (const loi of kiemTraCauHinh(ch)) if (!/vai-tro\.md|bộ não/.test(loi)) dong(false, loi);
  dong(coPhien(), 'Phiên Zalo đã lưu', 'Chạy: npm run dang-nhap');
  console.log(ok ? '\nSẵn sàng. Chạy: npm start' : '\nCòn mục cần sửa ở trên.');
}

async function nhom() {
  const ch = docCauHinh();
  const api = await ketNoi();
  const ds = await layNhom(api);
  const giao = new Map(ch.agents.flatMap((a) => a.nhom.map((n) => [n, a.id])));
  console.log(`Nick có ${ds.length} nhóm:\n`);
  for (const g of ds) console.log(`${g.id}  ${g.ten} (${g.so_thanh_vien} người)${giao.has(g.id) ? `  ← ${giao.get(g.id)}` : ''}`);
  console.log('\nGiao nhóm cho agent: npm run giao -- <id-agent> <id-nhóm> [id-nhóm khác...]');
}

/** Thêm nhóm vào agent trong cau-hinh.yaml (giữ nguyên chú thích). */
function giao() {
  const [idAgent, ...dsNhom] = thamSo;
  if (!idAgent || !dsNhom.length) throw new Error('Cú pháp: npm run giao -- <id-agent> <id-nhóm> [id-nhóm khác...]');
  docCauHinh();
  const doc = YAML.parseDocument(fs.readFileSync(FILE_CAU_HINH, 'utf8'));
  const agents = doc.get('agents');
  const i = agents?.items?.findIndex((a) => String(a.get('id')) === idAgent) ?? -1;
  if (i < 0) throw new Error(`Không có agent "${idAgent}" trong cau-hinh.yaml`);
  // Mỗi nhóm chỉ một agent: gỡ nhóm khỏi agent khác trước.
  agents.items.forEach((a, j) => {
    const cu = (a.get('nhom')?.toJSON?.() ?? []).map(String);
    const moi = j === i ? [...new Set([...cu, ...dsNhom])] : cu.filter((n) => !dsNhom.includes(n));
    if (j === i || moi.length !== cu.length) a.set('nhom', doc.createNode(moi, { flow: true }));
  });
  fs.writeFileSync(FILE_CAU_HINH, doc.toString());
  console.log(`Đã giao ${dsNhom.join(', ')} cho ${idAgent}. Khởi động lại (npm start) để áp dụng.`);
}

async function thu() {
  const ch = docCauHinh();
  const agent = timAgent(ch, layCo('agent') || ch.chat_rieng || ch.agents[0]?.id);
  const ten = layCo('ten') ?? 'Khách';
  const cauHoi = thamSo.join(' ').trim();
  const lichSu = [];
  const hoi = async (noi_dung) => {
    const tin = { ts: Date.now(), ten, noi_dung, la_bot: false };
    const kq = await hoiAgent({ ch, agent, tinhHuong: { noiChat: 'nhóm Zalo "Nhóm chạy thử"', lichSu: lichSu.slice(-20), tinMoi: [tin] } });
    lichSu.push(tin);
    const nhan = { tra_loi: 'TRẢ LỜI', bo_qua: 'IM LẶNG', chuyen_nguoi: 'CHUYỂN NGƯỜI THẬT' }[kq.hanh_dong];
    console.log(`\n${agent.ten} (${kq.giay}s) ${nhan}:`);
    if (kq.tin_nhan) console.log(kq.tin_nhan);
    if (kq.ly_do) console.log(`(lý do: ${kq.ly_do})`);
    if (kq.cau_hoi_thieu_du_lieu) console.log(`(bộ não chưa có: ${kq.cau_hoi_thieu_du_lieu})`);
    if (kq.tin_nhan && kq.hanh_dong !== 'bo_qua') lichSu.push({ ts: Date.now(), ten: agent.ten, noi_dung: kq.tin_nhan, la_bot: true });
  };
  if (cauHoi) return hoi(cauHoi);
  console.log(`Trò chuyện thử với ${agent.ten} (${agent.ai}${agent.model ? ` ${agent.model}` : ''}). Bạn đóng vai "${ten}". Gõ "thoat" để dừng.`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    const s = (await rl.question(`\n${ten}: `)).trim();
    if (!s) continue;
    if (/^(thoat|thoát|exit|quit)$/i.test(s)) break;
    try {
      await hoi(s);
    } catch (err) {
      console.log(`Lỗi: ${err.message}`);
    }
  }
  rl.close();
}

async function chay() {
  const ch = docCauHinh();
  const loi = kiemTraCauHinh(ch);
  if (loi.length) throw new Error(`Cấu hình chưa đúng:\n- ${loi.join('\n- ')}\n(Chạy npm run kiem-tra để xem chi tiết)`);
  if (ch.dong_bo.nguon.length) await dongBoTatCa(ch, { log: (s) => console.log(`[${gio()}] ${s}`) });
  await chayBot(ch);
  console.log(`[${gio()}] Trợ lý Zalo đang chạy. Bộ não: ${ch.bo_nao}`);
  for (const a of ch.agents) {
    console.log(`  - ${a.ten} (${a.id}): ${a.nhom.length} nhóm, ${a.tra_loi_khi === 'moi-tin' ? 'đọc mọi tin' : 'chỉ khi được tag'}, ${a.che_do === 'tu-gui' ? 'TỰ GỬI' : 'NHÁP (chỉ in ra đây, chưa gửi)'}`);
  }
  if (ch.chat_rieng) console.log(`  - Tin nhắn riêng: ${ch.chat_rieng}`);
  console.log('Nhấn Ctrl+C để dừng.\n');
}

const LENH = {
  chay,
  'dang-nhap': async () => {
    await dangNhapQR();
    console.log('Đăng nhập Zalo thành công, đã lưu phiên. Tiếp theo: npm run nhom để xem id các nhóm.');
  },
  nhom,
  giao,
  thu,
  'dong-bo': () => dongBoTatCa(docCauHinh()),
  'kiem-tra': kiemTra,
};

if (!LENH[lenh]) {
  console.log('Lệnh: npm start | npm run dang-nhap | npm run nhom | npm run giao -- <agent> <nhóm> | npm run thu -- [--agent id] ["câu hỏi"] | npm run dong-bo | npm run kiem-tra');
  process.exit(1);
}
try {
  await LENH[lenh]();
  if (lenh !== 'chay') process.exit(0);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}
