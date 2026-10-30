#!/usr/bin/env node
// Lệnh dòng: chay | chay-nen | dung | dang-nhap | nhom | giao | thu | dong-bo | kiem-tra | mau-vne
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import YAML from 'yaml';
import { FILE_CAU_HINH, FILE_TOM_TAT, GOC, THU_MUC_DATA, docCauHinh, fileVaiTro, kiemTraCauHinh, timAgent } from './cau-hinh.js';
import { chayLenh, hoiAgent } from './agent.js';
import { chayBot, gio } from './bot.js';
import { chayNen, dung, giuCho, pidDangChay } from './chay-nen.js';
import { dongBoTatCa } from './dong-bo.js';
import { KHACH_MAU, giaLap } from './gia-lap.js';
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
  const pid = pidDangChay();
  if (pid) console.log(`\nTrợ lý đang chạy ngầm (tiến trình ${pid}). Khởi động lại: npm run chay-nen. Tắt: npm run dung`);
  else console.log(ok ? '\nSẵn sàng. Chạy: npm run chay-nen' : '\nCòn mục cần sửa ở trên.');
}

async function nhom() {
  const ch = docCauHinh();
  const api = await ketNoi();
  const ds = await layNhom(api);
  const giao = new Map(ch.agents.flatMap((a) => a.nhom.map((n) => [n, a.id])));
  console.log(`Nick có ${ds.length} nhóm:\n`);
  for (const g of ds) console.log(`${g.id}  ${g.ten} (${g.so_thanh_vien} người)${giao.has(g.id) ? `  ← ${giao.get(g.id)}` : ''}`);
  console.log('\nGiao nhóm cho agent: npm run giao <id-agent> <id-nhóm> [id-nhóm khác...]');
}

/** Thêm nhóm vào agent trong cau-hinh.yaml (giữ nguyên chú thích). */
function giao() {
  const [idAgent, ...dsNhom] = thamSo;
  if (!idAgent || !dsNhom.length) throw new Error('Cú pháp: npm run giao <id-agent> <id-nhóm> [id-nhóm khác...]');
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
  console.log(`Đã giao ${dsNhom.join(', ')} cho ${idAgent}. Khởi động lại (npm run chay-nen) để áp dụng.`);
}

async function thu() {
  const ch = docCauHinh();
  // Cho phép "npm run thu <id-agent> ..." vì PowerShell nuốt dấu "--" của npm.
  let idAgent = layCo('agent');
  if (!idAgent && ch.agents.some((a) => a.id === thamSo[0])) idAgent = thamSo.shift();
  const agent = timAgent(ch, idAgent || ch.mac_dinh.agent || ch.agents[0]?.id);
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
    if (kq.anh.length) console.log(`(ảnh gửi kèm: ${kq.anh.join(', ')})`);
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

/** npm run gia-lap [id-agent] [vai-khách ...] [nhu cầu...] [--luot 5] */
async function giaLapLenh() {
  const ch = docCauHinh();
  let idAgent = layCo('agent');
  if (!idAgent && ch.agents.some((a) => a.id === thamSo[0])) idAgent = thamSo.shift();
  const agent = timAgent(ch, idAgent || ch.mac_dinh.agent || ch.agents[0]?.id);
  const soLuot = Number(layCo('luot')) || 5;
  const dsVai = [];
  while (thamSo.length && KHACH_MAU[thamSo[0]]) dsVai.push(thamSo.shift());
  const nhuCau = thamSo.join(' ').trim();
  if (!dsVai.length) dsVai.push('de-tinh', 'ky-tinh', 'mac-ca', 'kho-tinh', 'gai-bay');
  console.log(`Giả lập ${dsVai.length} khách (${dsVai.join(', ')}) với ${agent.ten}, tối đa ${soLuot} lượt mỗi khách. Không gửi gì ra Zalo. Mất vài phút...\n`);
  const kq = [];
  const hang = [...dsVai];
  await Promise.all(Array.from({ length: Math.min(3, hang.length) }, async () => {
    for (let vai = hang.shift(); vai; vai = hang.shift()) {
      try {
        kq.push(await giaLap({ ch, agent, tenVai: vai, soLuot, nhuCau, log: (s) => console.log(s) }));
      } catch (err) {
        console.log(`[${vai}] lỗi: ${err.message}`);
      }
    }
  }));
  console.log('\n=== KẾT QUẢ (0-10) ===');
  console.log('khách       tổng  dữ liệu  giống người  tình huống  dẫn chốt  an toàn');
  for (const r of kq) {
    const d = r.ketQua.diem;
    console.log(`${r.tenVai.padEnd(11)} ${String(r.ketQua.tong).padEnd(5)} ${String(d.dung_du_lieu).padEnd(8)} ${String(d.giong_nguoi).padEnd(12)} ${String(d.xu_ly_tinh_huong).padEnd(11)} ${String(d.dan_den_chot).padEnd(9)} ${d.an_toan}`);
  }
  for (const r of kq) {
    if (r.ketQua.loi.length) console.log(`\n[${r.tenVai}] lỗi:\n- ${r.ketQua.loi.join('\n- ')}`);
    if (r.ketQua.goi_y_sua.length) console.log(`[${r.tenVai}] gợi ý sửa:\n- ${r.ketQua.goi_y_sua.join('\n- ')}`);
  }
  console.log(`\nHội thoại đầy đủ: data/gia-lap/`);
}

async function chay() {
  giuCho();
  const ch = docCauHinh();
  const loi = kiemTraCauHinh(ch);
  if (loi.length) throw new Error(`Cấu hình chưa đúng:\n- ${loi.join('\n- ')}\n(Chạy npm run kiem-tra để xem chi tiết)`);
  // Đồng bộ chạy song song: lần đầu tải hàng trăm lịch trình mất vài phút, không bắt Zalo chờ.
  if (ch.dong_bo.nguon.length) dongBoTatCa(ch, { log: (s) => console.log(`[${gio()}] ${s}`) });
  await chayBot(ch);
  console.log(`[${gio()}] Trợ lý Zalo đang chạy. Bộ não: ${ch.bo_nao}`);
  for (const a of ch.agents) {
    console.log(`  - ${a.ten} (${a.id}, ${a.model || a.ai}): ${a.nhom.length} nhóm/người, ${a.tra_loi_khi === 'moi-tin' ? 'đọc mọi tin' : 'chỉ khi được tag'}, ${a.che_do === 'tu-gui' ? 'TỰ GỬI' : 'NHÁP (chỉ in ra đây, chưa gửi)'}`);
  }
  const md = ch.mac_dinh;
  if (md.agent && (md.chat_rieng || md.nhom_khi_duoc_tag)) {
    const viec = [md.chat_rieng && 'mọi tin nhắn riêng 1-1', md.nhom_khi_duoc_tag && 'mọi nhóm khác khi được tag'].filter(Boolean).join(' và ');
    const cheDo = (c) => (c === 'tu-gui' ? 'TỰ GỬI' : 'NHÁP');
    const kieu = md.chat_rieng && md.nhom_khi_duoc_tag && md.che_do !== md.che_do_nhom
      ? `tin riêng ${cheDo(md.che_do)}, nhóm ${cheDo(md.che_do_nhom)}`
      : cheDo(md.nhom_khi_duoc_tag && !md.chat_rieng ? md.che_do_nhom : md.che_do);
    console.log(`  - Mặc định: ${timAgent(ch, md.agent).ten} (${md.agent}) trả lời ${viec}, ${kieu}`);
  }
  console.log(process.env.TRO_LY_NEN ? 'Tắt: npm run dung\n' : 'Nhấn Ctrl+C để dừng.\n');
}

/** Thực hành với dữ liệu thật của VN Express Tour: chép bộ não, agent, cấu hình mẫu trong mau-vne/ rồi đồng bộ. */
async function mauVne() {
  const mau = path.join(GOC, 'mau-vne');
  const cauHinhMau = fs.readFileSync(path.join(mau, 'cau-hinh.yaml'), 'utf8');
  const dangDungVne = fs.existsSync(FILE_CAU_HINH) && /^bo_nao:\s*\.\/bo-nao-vne\s*$/m.test(fs.readFileSync(FILE_CAU_HINH, 'utf8'));
  if (!dangDungVne) {
    // Cất cấu hình và tóm tắt cũ để quay lại được; chạy lại lệnh này thì giữ nguyên nhóm đã giao.
    fs.mkdirSync(THU_MUC_DATA, { recursive: true });
    if (fs.existsSync(FILE_CAU_HINH)) fs.copyFileSync(FILE_CAU_HINH, path.join(THU_MUC_DATA, 'cau-hinh.truoc-vne.yaml'));
    if (fs.existsSync(FILE_TOM_TAT)) fs.copyFileSync(FILE_TOM_TAT, path.join(THU_MUC_DATA, 'tom-tat-doanh-nghiep.truoc-vne.md'));
    fs.writeFileSync(FILE_CAU_HINH, cauHinhMau);
  }
  fs.cpSync(path.join(mau, 'agents'), path.join(GOC, 'agents'), { recursive: true });
  const ch = docCauHinh();
  if (!fs.existsSync(ch.bo_nao)) fs.cpSync(path.join(mau, 'bo-nao'), ch.bo_nao, { recursive: true });

  // Bảng lịch khởi hành trước (vài giây) để agent trả lời được ngay, lịch trình chi tiết sau.
  const chiBang = (c) => ({ ...c, dong_bo: { ...c.dong_bo, nguon: c.dong_bo.nguon.map((n) => ({ ...n, tai_lich_trinh: false })) } });
  console.log('Đang tải Google Sheet lịch khởi hành của VN Express Tour...');
  await dongBoTatCa(chiBang(ch));
  const thuMuc = path.join(ch.bo_nao, ch.dong_bo.nguon[0]?.luu_vao ?? '');
  const coDuLieu = () => fs.existsSync(thuMuc) && fs.readdirSync(thuMuc).filter((f) => f.endsWith('.md')).length > 1;
  if (!coDuLieu()) {
    console.log('Không tải được Google Sheet, dùng file Excel có sẵn: du-lieu-mau/VNE3 - LKH TOUR GHÉP QUỐC TẾ.xlsx');
    const doc = YAML.parseDocument(fs.readFileSync(FILE_CAU_HINH, 'utf8'));
    doc.setIn(['dong_bo', 'nguon', 0, 'link'], './du-lieu-mau/VNE3 - LKH TOUR GHÉP QUỐC TẾ.xlsx');
    fs.writeFileSync(FILE_CAU_HINH, doc.toString());
    await dongBoTatCa(chiBang(docCauHinh()));
  }
  if (!coDuLieu()) throw new Error('Chưa đồng bộ được dữ liệu VNE, xem lỗi ở trên.');
  console.log('Đã có bảng lịch khởi hành. Đang tải hơn 500 lịch trình chi tiết (lần đầu khoảng 5-10 phút; bị ngắt thì lần sau tải tiếp, trợ lý khi chạy cũng tự tải tiếp)...');
  await dongBoTatCa(docCauHinh());
  console.log(`
Xong. Bộ não: ${ch.bo_nao}
Agent: tu-van-vne (khách lẻ, mặc định cho tin riêng) và ai-sales-vne (nhóm đại lý, CTV), đang ở chế độ TỰ GỬI (trả lời thật vào Zalo).
Thử ngay:
  npm run thu tu-van-vne "nhà mình 4 người muốn đi Quảng Châu tháng 12"
  npm run thu ai-sales-vne "Lệ Giang tháng 12 còn chỗ không em"
Nối Zalo: npm run dang-nhap, rồi npm run chay-nen.${dangDungVne ? '' : '\nCấu hình cũ đã cất ở data/cau-hinh.truoc-vne.yaml.'}`);
}

const LENH = {
  chay,
  'chay-nen': () => chayNen(),
  dung: () => dung(),
  'dang-nhap': async () => {
    // Đăng nhập lại sẽ đá phiên của bản đang chạy, nên tắt nó trước.
    if (await dung({ log: () => {} })) console.log('Đã tắt trợ lý đang chạy để đăng nhập lại.');
    await dangNhapQR();
    console.log('Đăng nhập Zalo thành công, đã lưu phiên. Tiếp theo: npm run chay-nen để chạy trợ lý (npm run nhom để xem id các nhóm).');
  },
  nhom,
  giao,
  thu,
  'dong-bo': () => dongBoTatCa(docCauHinh()),
  'gia-lap': giaLapLenh,
  'kiem-tra': kiemTra,
  'mau-vne': mauVne,
};

if (!LENH[lenh]) {
  console.log('Lệnh: npm start | npm run chay-nen | npm run dung | npm run dang-nhap | npm run nhom | npm run giao <agent> <nhóm> | npm run thu [id-agent] ["câu hỏi"] | npm run dong-bo | npm run kiem-tra | npm run mau-vne');
  process.exit(1);
}
try {
  await LENH[lenh]();
  if (lenh !== 'chay') process.exit(0);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}
