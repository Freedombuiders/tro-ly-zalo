// Đọc và kiểm tra cau-hinh.yaml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const THU_MUC_DATA = process.env.TRO_LY_DATA || path.join(GOC, 'data');
export const FILE_CAU_HINH = path.join(GOC, 'cau-hinh.yaml');
const FILE_MAU = path.join(GOC, 'cau-hinh.mau.yaml');

/** Đường dẫn trong cấu hình có thể tuyệt đối hoặc tính từ thư mục dự án. */
export function duongDan(p) {
  if (!p) return '';
  const s = String(p).trim().replace(/^~(?=$|[\\/])/, process.env.HOME || process.env.USERPROFILE || '~');
  return path.isAbsolute(s) ? s : path.resolve(GOC, s);
}

export function docCauHinh() {
  if (!fs.existsSync(FILE_CAU_HINH)) fs.copyFileSync(FILE_MAU, FILE_CAU_HINH);
  let raw;
  try {
    raw = YAML.parse(fs.readFileSync(FILE_CAU_HINH, 'utf8')) ?? {};
  } catch (err) {
    throw new Error(`cau-hinh.yaml viết sai cú pháp YAML: ${err.message}`);
  }
  const ch = {
    bo_nao: duongDan(raw.bo_nao || './bo-nao-mau'),
    ai: raw.ai === 'codex' ? 'codex' : 'claude',
    nhom_bao_cao: raw.nhom_bao_cao ? String(raw.nhom_bao_cao).trim() : '',
    mac_dinh: docMacDinh(raw),
    agents: [],
    dong_bo: {
      moi_phut: Number(raw.dong_bo?.moi_phut) || 0,
      nguon: Array.isArray(raw.dong_bo?.nguon) ? raw.dong_bo.nguon.filter((n) => n?.link) : [],
    },
  };
  for (const a of Array.isArray(raw.agents) ? raw.agents : []) {
    if (!a?.id) continue;
    const ai = a.ai === 'codex' || a.ai === 'claude' ? a.ai : ch.ai;
    ch.agents.push({
      id: String(a.id).trim(),
      ten: a.ten ? String(a.ten).trim() : String(a.id),
      nhom: (Array.isArray(a.nhom) ? a.nhom : a.nhom ? [a.nhom] : []).map((x) => String(x).trim()).filter(Boolean),
      tra_loi_khi: a.tra_loi_khi === 'khi-duoc-goi' ? 'khi-duoc-goi' : 'moi-tin',
      che_do: a.che_do === 'tu-gui' ? 'tu-gui' : 'nhap',
      ai,
      model: a.model ? String(a.model).trim() : modelCho(raw.model, ai, ch.ai),
    });
  }
  return ch;
}

/** Agent mặc định cho tin riêng 1-1 và cho các nhóm chưa giao khi được tag. Vẫn đọc "chat_rieng" của cấu hình cũ. */
function docMacDinh(raw) {
  const m = raw.mac_dinh;
  if (m && typeof m === 'object') {
    return {
      agent: m.agent ? String(m.agent).trim() : '',
      chat_rieng: m.chat_rieng !== false,
      nhom_khi_duoc_tag: m.nhom_khi_duoc_tag !== false,
      che_do: m.che_do === 'tu-gui' ? 'tu-gui' : 'nhap',
    };
  }
  if (typeof m === 'string' && m.trim()) return { agent: m.trim(), chat_rieng: true, nhom_khi_duoc_tag: true, che_do: 'nhap' };
  if (raw.chat_rieng) return { agent: String(raw.chat_rieng).trim(), chat_rieng: true, nhom_khi_duoc_tag: false, che_do: 'nhap' };
  return { agent: '', chat_rieng: false, nhom_khi_duoc_tag: false, che_do: 'nhap' };
}

/** Những lỗi cấu hình khiến trợ lý không chạy được. */
export function kiemTraCauHinh(ch) {
  const loi = [];
  if (!fs.existsSync(ch.bo_nao)) loi.push(`Không tìm thấy thư mục bộ não: ${ch.bo_nao}`);
  if (!ch.agents.length) loi.push('Chưa có agent nào trong cau-hinh.yaml');
  const daGiao = new Map();
  for (const a of ch.agents) {
    if (!fs.existsSync(fileVaiTro(a.id))) loi.push(`Agent ${a.id} thiếu file agents/${a.id}/vai-tro.md`);
    for (const n of a.nhom) {
      if (daGiao.has(n)) loi.push(`Nhóm ${n} đang giao cho cả ${daGiao.get(n)} và ${a.id}: mỗi nhóm chỉ một agent`);
      daGiao.set(n, a.id);
    }
  }
  if (ch.mac_dinh.agent && !ch.agents.some((a) => a.id === ch.mac_dinh.agent)) loi.push(`mac_dinh.agent trỏ tới agent không có: ${ch.mac_dinh.agent}`);
  return loi;
}

export const fileVaiTro = (id) => path.join(GOC, 'agents', id, 'vai-tro.md');
export const MODEL_MAC_DINH = { claude: 'claude-sonnet-5-5', codex: 'gpt-6.1-sol' };

/** "model" là một chuỗi (dùng cho AI chính) hoặc { claude, codex }. Trống thì dùng model mặc định. */
function modelCho(model, ai, aiChinh) {
  if (model && typeof model === 'object') return model[ai] ? String(model[ai]).trim() : MODEL_MAC_DINH[ai];
  if (model && ai === aiChinh) return String(model).trim();
  return MODEL_MAC_DINH[ai];
}
export const FILE_TOM_TAT = path.join(GOC, 'agents', 'tom-tat-doanh-nghiep.md');

export function timAgent(ch, id) {
  const a = ch.agents.find((x) => x.id === id);
  if (!a) throw new Error(`Không có agent "${id}". Các agent: ${ch.agents.map((x) => x.id).join(', ') || '(trống)'}`);
  return a;
}
