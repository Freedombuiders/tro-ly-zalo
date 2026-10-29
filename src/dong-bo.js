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

const LINK_GOOGLE_DOC = /https:\/\/docs\.google\.com\/document\/d\/([\w-]{20,})[^\s)|;]*/g;
const THU_MUC_LICH_TRINH = 'Lịch trình';
const FILE_CHI_MUC_LICH_TRINH = '.chi-muc-lich-trinh.json';
const TAI_LAI_SAU_MS = 24 * 3600 * 1000;
const THU_LAI_LOI_SAU_MS = 3600 * 1000;

async function taiGoogleDoc(id) {
  for (let lan = 1; ; lan++) {
    try {
      const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
      const loai = res.headers.get('content-type') || '';
      // Trang HTML = tài liệu chưa chia sẻ công khai: thử lại cũng vô ích.
      if (res.ok && loai.includes('text/html')) throw Object.assign(new Error('chưa chia sẻ'), { dungLai: true });
      if (!res.ok || !loai.includes('text/plain')) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (err.dungLai || lan >= 3) throw err;
      await new Promise((r) => setTimeout(r, lan * 2000));
    }
  }
}

/** Tên một lịch trình: dòng đầu trông như tuyến đi (có dấu gạch nối, chữ hoa), không thì dòng có chữ đầu tiên. */
export function tieuDeLichTrinh(text) {
  const dong = text.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 3);
  const tuyen = dong.find((s) => /[–-]/.test(s) && s.length <= 90 && s === s.toUpperCase());
  return (tuyen || dong[0] || 'Lịch trình').slice(0, 80);
}

/** Tải nội dung các Google Docs (lịch trình, mô tả sản phẩm) được link trong bảng. Trả về Map id -> đường dẫn file tương đối. */
async function taiLichTrinh(thuMuc, ids, log) {
  const goc = path.join(thuMuc, THU_MUC_LICH_TRINH);
  fs.mkdirSync(goc, { recursive: true });
  const fileChiMuc = path.join(goc, FILE_CHI_MUC_LICH_TRINH);
  let chiMuc = {};
  try { chiMuc = JSON.parse(fs.readFileSync(fileChiMuc, 'utf8')); } catch { /* lần đầu */ }
  const dem = { moi: 0, cu: 0, loi: 0 };
  const hangDoi = [...ids];
  const tai = async () => {
    for (let id = hangDoi.shift(); id; id = hangDoi.shift()) {
      const cu = chiMuc[id];
      const conMoi = cu && Date.now() - cu.luc < (cu.loi ? THU_LAI_LOI_SAU_MS : TAI_LAI_SAU_MS);
      if (conMoi && (cu.loi || fs.existsSync(path.join(goc, cu.file)))) {
        if (cu.loi) dem.loi++; else dem.cu++;
        continue;
      }
      try {
        const chu = (await taiGoogleDoc(id)).replace(/^\uFEFF/, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
        const tieuDe = tieuDeLichTrinh(chu);
        const file = `${tenFile(tieuDe)} [${id.slice(0, 10)}].md`;
        if (cu?.file && cu.file !== file) fs.rmSync(path.join(goc, cu.file), { force: true });
        fs.writeFileSync(path.join(goc, file), [
          '---', DAU_HIEU, `nguon: "https://docs.google.com/document/d/${id}/edit"`, '---', '', `# ${tieuDe}`, '', chu, '',
        ].join('\n'));
        chiMuc[id] = { file, luc: Date.now() };
        dem.moi++;
      } catch {
        // Giữ bản đã tải lần trước nếu có, chỉ đánh dấu để thử lại sau.
        chiMuc[id] = cu?.file ? { ...cu, luc: Date.now() - TAI_LAI_SAU_MS + THU_LAI_LOI_SAU_MS } : { loi: true, luc: Date.now() };
        dem.loi++;
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, tai));
  fs.writeFileSync(fileChiMuc, JSON.stringify(chiMuc));
  log?.(`Lịch trình: ${ids.size} tài liệu (${dem.moi} vừa tải, ${dem.cu} dùng bản đã tải, ${dem.loi} không tải được: cần bật chia sẻ "Bất kỳ ai có đường liên kết")`);
  return new Map(Object.entries(chiMuc).filter(([k, v]) => ids.has(k) && v.file).map(([k, v]) => [k, `${THU_MUC_LICH_TRINH}/${v.file}`]));
}

/** Gắn đường dẫn file lịch trình đã tải vào sau mỗi link Google Docs, và rút gọn link. */
export function ganLichTrinh(than, fileCua) {
  return than.replace(LINK_GOOGLE_DOC, (_m, id) => {
    const link = `https://docs.google.com/document/d/${id}/edit`;
    return fileCua.has(id) ? `${link}; chi tiết: ${fileCua.get(id)}` : link;
  });
}

/** Đồng bộ một nguồn. Trả về số trang tính đã ghi. */
export async function dongBoNguon(ch, nguon, { log } = {}) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await taiBangTinh(nguon.link));
  const ten = String(nguon.ten || 'Bảng tính').trim();
  const thuMuc = path.join(ch.bo_nao, nguon.luu_vao ? String(nguon.luu_vao) : path.join('Dữ liệu đồng bộ', tenFile(ten)));
  fs.mkdirSync(thuMuc, { recursive: true });
  const luc = thoiDiem();
  const trang = [];
  for (const ws of wb.worksheets) {
    if (ws.state && ws.state !== 'visible') continue;
    const than = trangTinhSangMarkdown(docDong(ws));
    if (than.trim()) trang.push({ ten: ws.name.trim(), file: `${tenFile(ws.name)}.md`, than });
  }
  if (nguon.tai_lich_trinh) {
    const ids = new Set(trang.flatMap((t) => [...t.than.matchAll(LINK_GOOGLE_DOC)].map((m) => m[1])));
    const fileCua = await taiLichTrinh(thuMuc, ids, log);
    for (const t of trang) t.than = ganLichTrinh(t.than, fileCua);
  }
  const mucLuc = [];
  const fileMoi = new Set([`0. Mục lục ${tenFile(ten)}.md`]);
  for (const t of trang) {
    fileMoi.add(t.file);
    const nhomTour = [...t.than.matchAll(/^## (.+)$/gm)].map((m) => m[1]).slice(0, 12);
    mucLuc.push(`- [[${t.file.replace(/\.md$/, '')}]]${nhomTour.length ? `: ${nhomTour.join('; ')}` : ''}`);
    fs.writeFileSync(path.join(thuMuc, t.file), [
      '---', DAU_HIEU, `nguon: "${ten}"`, `trang-tinh: "${t.ten}"`, `cap-nhat: "${luc}"`, '---', '',
      `# ${t.ten}`, '',
      `> Tự động đồng bộ từ bảng tính "${ten}" lúc ${luc}. Đây là dữ liệu mới nhất; sửa trong bảng tính gốc, đừng sửa file này.`, '',
      t.than, '',
    ].join('\n'));
  }
  fs.writeFileSync(path.join(thuMuc, `0. Mục lục ${tenFile(ten)}.md`), [
    '---', DAU_HIEU, `cap-nhat: "${luc}"`, '---', '',
    `# Mục lục: ${ten}`, '', `Đồng bộ lúc ${luc}. Mỗi trang tính là một file${nguon.tai_lich_trinh ? `; lịch trình chi tiết (tải từ Google Docs) nằm trong thư mục "${THU_MUC_LICH_TRINH}/", đường dẫn ghi sau chữ "chi tiết:" ở từng dòng` : ''}:`, '', ...mucLuc, '',
  ].join('\n'));
  // Ghi xong bản mới mới xoá file của lần trước mà trang tính đã bị đổi tên hoặc xoá.
  for (const f of fs.readdirSync(thuMuc)) {
    const day = path.join(thuMuc, f);
    if (f.endsWith('.md') && !fileMoi.has(f) && fs.readFileSync(day, 'utf8').includes(DAU_HIEU)) fs.rmSync(day);
  }
  return mucLuc.length;
}

export async function dongBoTatCa(ch, { log = console.log } = {}) {
  for (const nguon of ch.dong_bo.nguon) {
    try {
      const n = await dongBoNguon(ch, nguon, { log });
      log(`Đồng bộ "${nguon.ten}": ${n} trang tính.`);
    } catch (err) {
      log(`Đồng bộ "${nguon.ten}" lỗi: ${err.message}`);
    }
  }
}
