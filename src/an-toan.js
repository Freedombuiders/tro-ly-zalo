// Lớp bảo vệ trước người xấu: agent chỉ đọc được trong bộ não, và tin gửi đi không được lộ thông tin nội bộ.
import fs from 'node:fs';
import path from 'node:path';

export const TIN_TU_CHOI = 'Phần này em không hỗ trợ qua tin nhắn được ạ. Mình cần tư vấn gì về sản phẩm, dịch vụ cứ nhắn em nhé.';
const TOI_DA_MUC_MOI_CAP = 600;

/** Đường dẫn theo cú pháp luật quyền của Claude Code: "//" là đường dẫn tuyệt đối (Windows: //c/...). */
export function duongDanLuat(p) {
  const s = process.platform === 'win32'
    ? p.replace(/^([A-Za-z]):/, (_m, o) => `/${o.toLowerCase()}`).replace(/\\/g, '/')
    : p;
  return `/${s}`;
}

/**
 * Luật cấm đọc mọi thứ ngoài bộ não: ở từng thư mục trên đường từ gốc ổ đĩa tới bộ não,
 * cấm hết các mục ngang hàng. Cộng thêm các file nhạy cảm phòng khi bộ não là một thư mục rất rộng.
 */
export function luatChanDoc(boNao, { thuMucDuAn } = {}) {
  const dich = path.resolve(boNao);
  const chuoi = [];
  for (let p = dich; ; p = path.dirname(p)) {
    chuoi.unshift(p);
    if (path.dirname(p) === p) break;
  }
  const cam = [];
  for (let i = 0; i < chuoi.length - 1; i++) {
    let muc = [];
    try { muc = fs.readdirSync(chuoi[i]); } catch { continue; }
    for (const ten of muc.slice(0, TOI_DA_MUC_MOI_CAP)) {
      const day = path.join(chuoi[i], ten);
      if (day === chuoi[i + 1]) continue;
      cam.push(duongDanLuat(day), `${duongDanLuat(day)}/**`);
    }
  }
  if (thuMucDuAn) {
    for (const ten of ['data', 'cau-hinh.yaml', '.env']) cam.push(duongDanLuat(path.join(thuMucDuAn, ten)), `${duongDanLuat(path.join(thuMucDuAn, ten))}/**`);
  }
  cam.push('**/Me.md', '**/.env', '**/.env.*', '**/*.pem', '**/*.key', '**/id_rsa*', '**/id_ed25519*', '**/.obsidian/**',
    '~/.ssh/**', '~/.claude/**', '~/.codex/**', '~/.aws/**', '~/.config/**', '~/.gnupg/**', '~/.npmrc', '~/.netrc', '~/.git-credentials');
  return ['Read', 'Grep', 'Glob'].flatMap((cong) => cam.map((c) => `${cong}(${c})`));
}

const MAU_NHAY_CAM = [
  [/(^|[\s"'(:])(\/(Users|home|root|etc|var|private|tmp|opt|Volumes)\/|[A-Za-z]:\\|~\/)/, 'đường dẫn trên máy'],
  [/(cau-hinh\.ya?ml|phien-zalo|luat-chung|vai-tro\.md|tom-tat-doanh-nghiep|SKILL\.md|package\.json|node_modules)/i, 'tên file nội bộ'],
  [/(^|[\s/"'])\.env\b/, 'file .env'],
  [/[^\s"'()]+\.(md|json|ya?ml|js|ts|mjs|env|pem|key|sqlite|db)(?=$|[\s"'),.;:!?])/i, 'tên file'],
  [/BEGIN [A-Z ]*PRIVATE KEY|\b(sk-|ghp_|gho_|xox[bp]-|AKIA)[A-Za-z0-9_-]{10,}/, 'khoá bí mật'],
  [/\b(imei|zpw_sek|zpsid|cookie|access_token|refresh_token)\b/i, 'phiên đăng nhập'],
  [/[A-Za-z0-9+/=_-]{60,}/, 'chuỗi mã dài'],
];

/** Lý do tin không được gửi (lộ đường dẫn, file nội bộ, khoá, phiên đăng nhập), hoặc chuỗi rỗng nếu an toàn. */
export function kiemTraTinGui(text) {
  const s = String(text ?? '');
  for (const [mau, lyDo] of MAU_NHAY_CAM) if (mau.test(s)) return lyDo;
  return '';
}
