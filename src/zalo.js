// Kết nối nick Zalo cá nhân qua thư viện không chính thức zca-js: đăng nhập QR, lưu phiên, đọc nhóm, gửi tin.
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import { LoginQRCallbackEventType, ThreadType, Zalo } from 'zca-js';
import { THU_MUC_DATA } from './cau-hinh.js';

export { ThreadType };

const FILE_PHIEN = path.join(THU_MUC_DATA, 'phien-zalo.json');
const FILE_QR = path.join(THU_MUC_DATA, 'qr-zalo.png');

// zca-js cần kích thước ảnh khi tải ảnh lên Zalo.
async function thongTinAnh(file) {
  const data = await fs.promises.readFile(file);
  const { width, height } = imageSize(data);
  return { width, height, size: data.length };
}

const taoZalo = () => new Zalo({ selfListen: true, checkUpdate: false, logging: false, imageMetadataGetter: thongTinAnh });

export const coPhien = () => fs.existsSync(FILE_PHIEN);

function moFile(f) {
  const lenh = process.platform === 'win32' ? `start "" "${f}"` : process.platform === 'darwin' ? `open "${f}"` : `xdg-open "${f}"`;
  exec(lenh, () => { /* không mở được thì người dùng tự mở file */ });
}

/** Đăng nhập bằng mã QR, lưu phiên vào data/phien-zalo.json. */
export async function dangNhapQR({ log = console.log } = {}) {
  fs.mkdirSync(THU_MUC_DATA, { recursive: true });
  let lanHetHan = 0;
  const api = await taoZalo().loginQR({ qrPath: FILE_QR }, async (ev) => {
    switch (ev.type) {
      case LoginQRCallbackEventType.QRCodeGenerated:
        await ev.actions.saveToFile(FILE_QR);
        log(`\nMở app Zalo trên điện thoại > biểu tượng QR > quét mã trong ảnh:\n  ${FILE_QR}\n`);
        moFile(FILE_QR);
        break;
      case LoginQRCallbackEventType.QRCodeExpired:
        if (++lanHetHan > 3) {
          log('Mã QR hết hạn nhiều lần, dừng. Chạy lại lệnh đăng nhập khi sẵn sàng.');
          ev.actions.abort();
        } else {
          log('Mã QR hết hạn, đang tạo mã mới...');
          ev.actions.retry();
        }
        break;
      case LoginQRCallbackEventType.QRCodeScanned:
        log(`Đã quét bởi "${ev.data.display_name}". Bấm Đăng nhập trên điện thoại để xác nhận.`);
        break;
      case LoginQRCallbackEventType.QRCodeDeclined:
        log('Đăng nhập bị từ chối trên điện thoại.');
        break;
      case LoginQRCallbackEventType.GotLoginInfo:
        fs.writeFileSync(FILE_PHIEN, JSON.stringify({
          cookie: ev.data.cookie, imei: ev.data.imei, userAgent: ev.data.userAgent,
        }), { mode: 0o600 });
        break;
    }
  });
  fs.rmSync(FILE_QR, { force: true });
  return api;
}

/** Đăng nhập lại từ phiên đã lưu. */
export async function ketNoi() {
  if (!coPhien()) throw new Error('Chưa đăng nhập Zalo. Chạy: npm run dang-nhap');
  const phien = JSON.parse(fs.readFileSync(FILE_PHIEN, 'utf8'));
  try {
    return await taoZalo().login(phien);
  } catch (err) {
    throw new Error(`Không đăng nhập lại được bằng phiên đã lưu (${err.message}). Phiên có thể đã hết hạn: chạy npm run dang-nhap để quét QR lại.`);
  }
}

/** Danh sách nhóm của nick: [{ id, ten, so_thanh_vien }]. */
export async function layNhom(api) {
  const ids = Object.keys((await api.getAllGroups()).gridVerMap ?? {});
  const nhom = [];
  for (let i = 0; i < ids.length; i += 50) {
    const info = await api.getGroupInfo(ids.slice(i, i + 50));
    for (const [id, g] of Object.entries(info.gridInfoMap ?? {})) {
      nhom.push({ id, ten: g.name ?? '(không tên)', so_thanh_vien: g.totalMember ?? g.memVerList?.length ?? 0 });
    }
  }
  return nhom.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
}

const tenNhomDaBiet = new Map();
export async function tenNhom(api, id) {
  if (!tenNhomDaBiet.has(id)) {
    try {
      const g = (await api.getGroupInfo(id)).gridInfoMap?.[id];
      tenNhomDaBiet.set(id, g?.name ?? id);
    } catch {
      return id;
    }
  }
  return tenNhomDaBiet.get(id);
}

/** Chuyển nội dung tin Zalo (chữ, ảnh, tệp, sticker...) thành một dòng chữ cho agent đọc. */
export function noiDungTin(data) {
  const c = data?.content;
  if (typeof c === 'string') return c;
  const loai = String(data?.msgType ?? '');
  const tieuDe = c && typeof c === 'object' ? String(c.title ?? '').trim() : '';
  const nhan = {
    'chat.photo': 'Ảnh', 'chat.sticker': 'Sticker', 'share.file': 'Tệp', 'chat.voice': 'Tin nhắn thoại',
    'chat.video.msg': 'Video', 'chat.gif': 'GIF', 'chat.recommended': 'Liên kết', 'chat.link': 'Liên kết',
    'chat.location.new': 'Vị trí', 'chat.webcontent': 'Liên kết',
  }[loai] ?? 'Đính kèm';
  const link = c && typeof c === 'object' && nhan === 'Liên kết' ? String(c.href ?? '') : '';
  return `[${nhan}${tieuDe ? `: ${tieuDe}` : ''}${link ? ` ${link}` : ''}]`;
}

/** Gửi ảnh (đường dẫn file trên máy), tối đa vài ảnh một lần. */
export async function guiAnh(api, threadId, loai, files) {
  return api.sendMessage({ msg: '', attachments: files }, threadId, loai);
}

/** Gửi tin chữ, trích dẫn tin gốc nếu có (không trích được thì gửi thường). */
export async function guiTin(api, threadId, loai, text, quote) {
  const msg = text.length > 3000 ? `${text.slice(0, 2990)}…` : text;
  try {
    await api.sendTypingEvent(threadId, loai);
  } catch { /* không bắt buộc */ }
  await new Promise((r) => setTimeout(r, Math.min(1500 + msg.length * 15, 6000)));
  if (quote) {
    try {
      return await api.sendMessage({ msg, quote }, threadId, loai);
    } catch { /* thử lại không trích dẫn */ }
  }
  return api.sendMessage({ msg }, threadId, loai);
}
