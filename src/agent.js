// Một lượt trả lời: dựng lời nhắc, gọi Claude Code hoặc Codex (chỉ được đọc bộ não), nhận về một JSON.
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { FILE_TOM_TAT, GOC, THU_MUC_DATA, fileVaiTro } from './cau-hinh.js';

const HET_GIO_MS = 4 * 60 * 1000;
const LA_WINDOWS = process.platform === 'win32';

const SCHEMA = {
  type: 'object',
  properties: {
    hanh_dong: { type: 'string', enum: ['tra_loi', 'bo_qua', 'chuyen_nguoi'] },
    tin_nhan: { type: 'string' },
    ly_do: { type: 'string' },
    cau_hoi_thieu_du_lieu: { type: 'string' },
    anh: { type: 'array', items: { type: 'string' } },
  },
  required: ['hanh_dong', 'tin_nhan', 'ly_do', 'cau_hoi_thieu_du_lieu', 'anh'],
  additionalProperties: false,
};

const docNeuCo = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : '');
export const DUOI_ANH = /\.(jpe?g|png|webp|gif)$/i;
const TOI_DA_ANH_LIET_KE = 200;

/** Danh sách ảnh trong bộ não (đường dẫn tính từ thư mục bộ não), bỏ thư mục ẩn và mẫu. */
export function dsAnh(boNao) {
  const ra = [];
  const di = (thuMuc, tuongDoi) => {
    let muc;
    try { muc = fs.readdirSync(thuMuc, { withFileTypes: true }); } catch { return; }
    for (const m of muc) {
      if (ra.length >= TOI_DA_ANH_LIET_KE) return;
      if (m.name.startsWith('.') || m.name === 'node_modules' || /template/i.test(m.name)) continue;
      const rel = tuongDoi ? `${tuongDoi}/${m.name}` : m.name;
      if (m.isDirectory()) di(path.join(thuMuc, m.name), rel);
      else if (DUOI_ANH.test(m.name)) ra.push(rel);
    }
  };
  di(boNao, '');
  return ra;
}

export function gioVietNam(d = new Date()) {
  const thu = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return {
    ngay: `${thu[vn.getUTCDay()]}, ${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()}`,
    gio: `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}`,
  };
}

export function loiNhacHeThong(agent) {
  const vaiTro = docNeuCo(fileVaiTro(agent.id));
  if (!vaiTro) throw new Error(`Thiếu agents/${agent.id}/vai-tro.md`);
  const tomTat = docNeuCo(FILE_TOM_TAT);
  const { ngay, gio } = gioVietNam();
  return [
    docNeuCo(path.join(GOC, 'src', 'luat-chung.md')),
    `## Vai trò của bạn: ${agent.ten}\n\n${vaiTro}`,
    tomTat && `## Tóm tắt doanh nghiệp (chi tiết nằm trong bộ não)\n\n${tomTat}`,
    `Bây giờ là ${gio}, ${ngay} (giờ Việt Nam).`,
  ].filter(Boolean).join('\n\n');
}

const dongTin = (t) => `[${gioVietNam(new Date(t.ts)).gio}] ${t.la_bot ? 'Bạn' : t.ten}: ${t.noi_dung}`;

/**
 * tinhHuong: { noiChat, lichSu: Tin[], tinMoi: Tin[], ghiChu? }
 * Tin: { ts, ten, noi_dung, la_bot }
 */
export function loiNhacNguoiDung(agent, tinhHuong) {
  const phan = [`Nơi trò chuyện: ${tinhHuong.noiChat}. Bạn là "${agent.ten}"${tinhHuong.tenNick ? `, nhắn bằng nick Zalo tên "${tinhHuong.tenNick}" (tin có "@${tinhHuong.tenNick}" là đang gọi bạn)` : ''}.`];
  if (tinhHuong.lichSu?.length) phan.push(`Tin nhắn trước đó (cũ đến mới):\n${tinhHuong.lichSu.map(dongTin).join('\n')}`);
  phan.push(`Tin mới cần xem xét:\n${tinhHuong.tinMoi.map(dongTin).join('\n')}`);
  if (tinhHuong.ghiChu) phan.push(tinhHuong.ghiChu);
  if (tinhHuong.anhCoSan?.length) phan.push(`Ảnh có sẵn trong bộ não, gửi kèm được (ghi đúng đường dẫn vào "anh"):\n${tinhHuong.anhCoSan.map((a) => `- ${a}`).join('\n')}`);
  phan.push('Quyết định trả lời, im lặng hay chuyển người thật. Cần số liệu thì tra bộ não trước. Cuối cùng trả về đúng một JSON theo mẫu.');
  return phan.join('\n\n');
}

/** Hỏi agent. Trả về { hanh_dong, tin_nhan, ly_do, cau_hoi_thieu_du_lieu, giay }. */
export async function hoiAgent({ ch, agent, tinhHuong }) {
  const he = loiNhacHeThong(agent);
  const nguoi = loiNhacNguoiDung(agent, { ...tinhHuong, anhCoSan: tinhHuong.anhCoSan ?? dsAnh(ch.bo_nao) });
  const thuMuc = path.join(THU_MUC_DATA, 'tmp', crypto.randomUUID());
  fs.mkdirSync(thuMuc, { recursive: true });
  const batDau = Date.now();
  try {
    const kq = agent.ai === 'codex'
      ? await chayCodex({ ch, agent, he, nguoi, thuMuc })
      : await chayClaude({ ch, agent, he, nguoi, thuMuc });
    return { ...chuanHoa(kq), giay: Math.round((Date.now() - batDau) / 1000) };
  } finally {
    fs.rmSync(thuMuc, { recursive: true, force: true });
  }
}

async function chayClaude({ ch, agent, he, nguoi, thuMuc }) {
  const fileHe = path.join(thuMuc, 'he-thong.md');
  fs.writeFileSync(fileHe, he);
  const args = [
    '-p', '--output-format', 'json', '--no-session-persistence', '--strict-mcp-config',
    '--tools', 'Read,Grep,Glob', '--allowedTools', 'Read,Grep,Glob', '--disallowedTools', 'Read(./Me.md)',
    '--max-turns', '20', '--append-system-prompt-file', fileHe,
  ];
  // Trên Windows lệnh chạy qua cmd.exe, chuỗi JSON có ngoặc kép dễ vỡ: bỏ schema, tự đọc JSON trong câu trả lời.
  if (!LA_WINDOWS) args.push('--json-schema', JSON.stringify(SCHEMA));
  if (agent.model) args.push('--model', agent.model);
  const out = await chayLenh('claude', args, { cwd: ch.bo_nao, input: nguoi });
  let obj;
  try {
    obj = JSON.parse(out);
  } catch {
    throw new Error(`Claude trả về không đúng định dạng: ${out.slice(0, 300)}`);
  }
  if (obj.is_error) throw new Error(`Claude báo lỗi: ${String(obj.result || obj.subtype).slice(0, 300)}`);
  return obj.structured_output ?? layJson(obj.result);
}

async function chayCodex({ ch, agent, he, nguoi, thuMuc }) {
  const fileSchema = path.join(thuMuc, 'schema.json');
  const fileKq = path.join(thuMuc, 'ket-qua.json');
  fs.writeFileSync(fileSchema, JSON.stringify(SCHEMA));
  const args = [
    'exec', '--skip-git-repo-check', '--ephemeral', '-C', ch.bo_nao, '-s', 'read-only',
    '-c', 'approval_policy=never', '--output-schema', fileSchema, '-o', fileKq,
  ];
  if (agent.model) args.push('-m', agent.model);
  args.push('-');
  await chayLenh('codex', args, { cwd: ch.bo_nao, input: `${he}\n\n---\n\n${nguoi}` });
  return layJson(docNeuCo(fileKq));
}

/** Lấy đối tượng JSON cuối cùng trong một đoạn chữ. */
export function layJson(text) {
  const s = String(text ?? '').trim();
  try {
    return JSON.parse(s);
  } catch { /* tìm khối JSON bên trong */ }
  const khoi = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (khoi) {
    try { return JSON.parse(khoi[1]); } catch { /* thử tiếp */ }
  }
  const j = s.lastIndexOf('}');
  for (let i = s.lastIndexOf('{', j); i >= 0 && j > i; i = i > 0 ? s.lastIndexOf('{', i - 1) : -1) {
    try {
      const o = JSON.parse(s.slice(i, j + 1));
      if (o && typeof o === 'object' && 'hanh_dong' in o) return o;
    } catch { /* lùi tiếp */ }
  }
  throw new Error(`Không đọc được JSON trong câu trả lời: ${s.slice(0, 300)}`);
}

export function chuanHoa(o) {
  const hd = ['tra_loi', 'bo_qua', 'chuyen_nguoi'].includes(o?.hanh_dong) ? o.hanh_dong : 'bo_qua';
  const tin = String(o?.tin_nhan ?? '').trim();
  return {
    hanh_dong: hd === 'tra_loi' && !tin ? 'bo_qua' : hd,
    tin_nhan: tin,
    ly_do: String(o?.ly_do ?? '').trim(),
    cau_hoi_thieu_du_lieu: String(o?.cau_hoi_thieu_du_lieu ?? '').trim(),
    anh: (Array.isArray(o?.anh) ? o.anh : []).map((a) => String(a).trim()).filter((a) => DUOI_ANH.test(a)).slice(0, 3),
  };
}

const quoteCmd = (a) => (/[\s&|<>^()"%!,;=]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);

/** Chạy một CLI, gửi input qua stdin, trả về stdout. */
export function chayLenh(bin, args, { cwd, input, timeoutMs = HET_GIO_MS }) {
  return new Promise((resolve, reject) => {
    const child = LA_WINDOWS
      ? spawn([bin, ...args.map(quoteCmd)].join(' '), { cwd, shell: true, windowsHide: true })
      : spawn(bin, args, { cwd });
    let out = '';
    let err = '';
    const hen = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${bin} chạy quá ${Math.round(timeoutMs / 1000)} giây, đã dừng`));
    }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => {
      clearTimeout(hen);
      reject(e.code === 'ENOENT' ? new Error(`Không tìm thấy lệnh "${bin}". Cài và đăng nhập ${bin === 'codex' ? 'Codex' : 'Claude Code'} trước.`) : e);
    });
    child.on('close', (code) => {
      clearTimeout(hen);
      if (code === 0) resolve(out);
      else reject(new Error(`${bin} thoát với mã ${code}: ${(err || out).trim().slice(-500)}`));
    });
    child.stdin.on('error', () => { /* tiến trình đã thoát, lỗi thật nằm ở close */ });
    child.stdin.end(input ?? '');
  });
}
