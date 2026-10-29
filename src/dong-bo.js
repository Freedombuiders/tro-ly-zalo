// Đồng bộ bảng tính (Google Sheet hoặc file .xlsx) thành ghi chú Markdown trong bộ não, mỗi trang tính một file.
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { duongDan } from './cau-hinh.js';

const DAU_HIEU = 'dong-bo: tu-dong';
// Ô trống ở các cột này nghĩa là "chưa có", không phải "giống dòng trên".
const KHONG_DIEN_TIEP = /note|ghi chú|chỗ|code|mã|stt|tình trạng|trạng thái/i;

export function linkTaiVe(link) {
  const m = String(link).match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  return m ? `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=xlsx` : null;
}

async function taiBangTinh(link) {
  const url = linkTaiVe(link);
  if (!url) {
    const f = duongDan(link);
    if (!fs.existsSync(f)) throw new Error(`Không tìm thấy file ${f}`);
    return fs.readFileSync(f);
  }
  const res = await fetch(url, { redirect: 'follow' });
  const loai = res.headers.get('content-type') || '';
  if (!res.ok || loai.includes('text/html')) {
    throw new Error('Không tải được Google Sheet. Mở Google Sheet > Chia sẻ > "Bất kỳ ai có đường liên kết" > Người xem, rồi thử lại.');
  }
  return Buffer.from(await res.arrayBuffer());
}

const p2 = (n) => String(n).padStart(2, '0');

export function giaTriO(v, tenCot = '') {
  if (v == null) return '';
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return '';
    if (/tháng/i.test(tenCot) && v.getUTCDate() === 1) return `Tháng ${v.getUTCMonth() + 1}/${v.getUTCFullYear()}`;
    return `${p2(v.getUTCDate())}/${p2(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`;
  }
  if (typeof v === 'number') {
    if (Number.isInteger(v) && Math.abs(v) >= 1000) return v.toLocaleString('vi-VN');
    return String(Math.round(v * 100) / 100);
  }
  if (typeof v === 'boolean') return v ? 'Có' : 'Không';
  if (typeof v === 'object') {
    if ('result' in v || 'formula' in v) return giaTriO(v.result, tenCot);
    if (Array.isArray(v.richText)) return giaTriO(v.richText.map((t) => t.text).join(''), tenCot);
    if ('hyperlink' in v) {
      const chu = giaTriO(v.text, tenCot);
      return chu && chu !== v.hyperlink ? `${chu} (${v.hyperlink})` : String(v.hyperlink);
    }
    if ('error' in v) return '';
    if ('text' in v) return giaTriO(v.text, tenCot);
  }
  return String(v).replace(/\s*\n\s*/g, ' / ').trim();
}

/** Đọc một trang tính thành các dòng ô (ô gộp phụ coi như trống). */
function docDong(ws) {
  const dong = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const o = [];
    row.eachCell({ includeEmpty: true }, (cell, c) => {
      const gop = cell.isMerged && cell.master && cell.master.address !== cell.address;
      o[c - 1] = gop ? null : cell.value;
      if (cell.hyperlink && typeof cell.value !== 'object') o[c - 1] = { text: cell.value, hyperlink: cell.hyperlink };
    });
    dong.push(o);
  });
  return dong;
}

const laSo = (v) => typeof v === 'number' || v instanceof Date;

/** Chuyển các dòng của một trang tính thành Markdown dễ tra cứu: mỗi dòng dữ liệu là "Cột: giá trị | ...". */
export function trangTinhSangMarkdown(dong) {
  const chuDong = (o) => o.map((v) => giaTriO(v));
  const iTieuDe = dong.findIndex((o) => {
    const co = o.filter((v) => v != null && giaTriO(v) !== '');
    return co.length >= 3 && co.every((v) => !laSo(v) && giaTriO(v).length <= 40);
  });
  const ra = [];
  const dongDau = iTieuDe < 0 ? dong : dong.slice(0, iTieuDe);
  for (const o of dongDau) {
    const chu = chuDong(o).filter(Boolean);
    if (chu.length) ra.push(chu.join(' | '));
  }
  if (iTieuDe < 0) return ra.join('\n\n');

  const tieuDe = chuDong(dong[iTieuDe]);
  const tenCot = (c) => tieuDe[c] || `Cột ${c + 1}`;
  ra.push('');
  let truoc = [];
  let soDong = 0;
  for (const o of dong.slice(iTieuDe + 1)) {
    const chu = o.map((v, c) => giaTriO(v, tenCot(c)));
    const coGiaTri = chu.map((s, c) => (s ? c : -1)).filter((c) => c >= 0);
    if (!coGiaTri.length) continue;
    if (coGiaTri.length === 1 && !laSo(o[coGiaTri[0]])) {
      ra.push('', `## ${chu[coGiaTri[0]]}`, '');
      truoc = [];
      continue;
    }
    const cap = [];
    const soCot = Math.max(chu.length, tieuDe.length);
    for (let c = 0; c < soCot; c++) {
      let s = chu[c] || '';
      if (!s && truoc[c] && !KHONG_DIEN_TIEP.test(tenCot(c))) s = truoc[c];
      if (s) cap.push(`${tenCot(c)}: ${s}`);
    }
    truoc = chu.map((s, c) => s || (KHONG_DIEN_TIEP.test(tenCot(c)) ? '' : truoc[c] || ''));
    ra.push(`- ${cap.join(' | ')}`);
    soDong++;
  }
  if (!soDong) return dong.map((o) => chuDong(o).filter(Boolean).join(' | ')).filter(Boolean).join('\n\n');
  return ra.join('\n').replace(/\n{3,}/g, '\n\n');
}

const tenFile = (s) => s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'Trang tính';

function thoiDiem() {
  const vn = new Date(Date.now() + 7 * 3600 * 1000);
  return `${p2(vn.getUTCHours())}:${p2(vn.getUTCMinutes())} ${p2(vn.getUTCDate())}/${p2(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()}`;
}

/** Đồng bộ một nguồn. Trả về số trang tính đã ghi. */
export async function dongBoNguon(ch, nguon) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await taiBangTinh(nguon.link));
  const ten = String(nguon.ten || 'Bảng tính').trim();
  const thuMuc = path.join(ch.bo_nao, nguon.luu_vao ? String(nguon.luu_vao) : path.join('Dữ liệu đồng bộ', tenFile(ten)));
  fs.mkdirSync(thuMuc, { recursive: true });
  // Xoá các file do lần đồng bộ trước tạo (trang tính có thể đã bị đổi tên hoặc xoá).
  for (const f of fs.readdirSync(thuMuc)) {
    const day = path.join(thuMuc, f);
    if (f.endsWith('.md') && fs.readFileSync(day, 'utf8').includes(DAU_HIEU)) fs.rmSync(day);
  }
  const luc = thoiDiem();
  const mucLuc = [];
  for (const ws of wb.worksheets) {
    if (ws.state && ws.state !== 'visible') continue;
    const than = trangTinhSangMarkdown(docDong(ws));
    if (!than.trim()) continue;
    const file = `${tenFile(ws.name)}.md`;
    const nhomTour = [...than.matchAll(/^## (.+)$/gm)].map((m) => m[1]).slice(0, 12);
    mucLuc.push(`- [[${file.replace(/\.md$/, '')}]]${nhomTour.length ? `: ${nhomTour.join('; ')}` : ''}`);
    fs.writeFileSync(path.join(thuMuc, file), [
      '---', DAU_HIEU, `nguon: "${ten}"`, `trang-tinh: "${ws.name.trim()}"`, `cap-nhat: "${luc}"`, '---', '',
      `# ${ws.name.trim()}`, '',
      `> Tự động đồng bộ từ bảng tính "${ten}" lúc ${luc}. Đây là dữ liệu mới nhất; sửa trong bảng tính gốc, đừng sửa file này.`, '',
      than, '',
    ].join('\n'));
  }
  fs.writeFileSync(path.join(thuMuc, `0. Mục lục ${tenFile(ten)}.md`), [
    '---', DAU_HIEU, `cap-nhat: "${luc}"`, '---', '',
    `# Mục lục: ${ten}`, '', `Đồng bộ lúc ${luc}. Mỗi trang tính là một file:`, '', ...mucLuc, '',
  ].join('\n'));
  return mucLuc.length;
}

export async function dongBoTatCa(ch, { log = console.log } = {}) {
  for (const nguon of ch.dong_bo.nguon) {
    try {
      const n = await dongBoNguon(ch, nguon);
      log(`Đồng bộ "${nguon.ten}": ${n} trang tính.`);
    } catch (err) {
      log(`Đồng bộ "${nguon.ten}" lỗi: ${err.message}`);
    }
  }
}
