// Chạy trợ lý ngầm (vẫn chạy khi đóng Claude Code / Codex), ghi nhật ký vào data/bot.log; mỗi lúc chỉ một bản.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { GOC, THU_MUC_DATA } from './cau-hinh.js';

export const FILE_PID = path.join(THU_MUC_DATA, 'bot.pid');
export const FILE_LOG = path.join(THU_MUC_DATA, 'bot.log');
const CHO_KHOI_DONG_MS = 60_000;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

function conSong(pid) {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
}

/** pid của bản trợ lý đang chạy, hoặc 0. */
export function pidDangChay() {
  let pid = 0;
  try { pid = Number(fs.readFileSync(FILE_PID, 'utf8')); } catch { return 0; }
  return pid > 0 && conSong(pid) ? pid : 0;
}

/** Ghi pid của tiến trình này (xoá khi thoát). Đã có bản khác chạy thì báo lỗi, vì hai bản cùng nick sẽ đá phiên nhau. */
export function giuCho() {
  const pid = pidDangChay();
  if (pid && pid !== process.pid) throw new Error(`Trợ lý đang chạy rồi (tiến trình ${pid}). Mỗi nick Zalo chỉ chạy một bản: tắt bằng npm run dung, hoặc khởi động lại bằng npm run chay-nen.`);
  fs.mkdirSync(THU_MUC_DATA, { recursive: true });
  fs.writeFileSync(FILE_PID, String(process.pid));
  process.on('exit', () => {
    try { if (Number(fs.readFileSync(FILE_PID, 'utf8')) === process.pid) fs.rmSync(FILE_PID); } catch { /* đã xoá */ }
  });
  for (const tinHieu of ['SIGINT', 'SIGTERM']) process.once(tinHieu, () => process.exit(0));
}

/** Tắt bản đang chạy. Trả về false nếu không có bản nào. */
export async function dung({ log = console.log } = {}) {
  const pid = pidDangChay();
  if (!pid) {
    log('Trợ lý không chạy.');
    return false;
  }
  process.kill(pid, 'SIGTERM');
  for (let i = 0; i < 50 && conSong(pid); i++) await ngu(100);
  if (conSong(pid)) process.kill(pid, 'SIGKILL');
  fs.rmSync(FILE_PID, { force: true });
  log(`Đã tắt trợ lý (tiến trình ${pid}).`);
  return true;
}

/** Khởi động (hoặc khởi động lại) trợ lý chạy ngầm, chờ tới khi kết nối Zalo xong rồi in phần đầu nhật ký. */
export async function chayNen({ log = console.log, lenh = [path.join(GOC, 'src', 'lenh.js'), 'chay'], choMs = CHO_KHOI_DONG_MS } = {}) {
  if (await dung({ log: () => {} })) log('Đã tắt bản đang chạy, khởi động lại...');
  fs.mkdirSync(THU_MUC_DATA, { recursive: true });
  const dau = fs.existsSync(FILE_LOG) ? fs.statSync(FILE_LOG).size : 0;
  const fd = fs.openSync(FILE_LOG, 'a');
  const con = spawn(process.execPath, lenh, {
    cwd: GOC, detached: true, windowsHide: true, stdio: ['ignore', fd, fd], env: { ...process.env, TRO_LY_NEN: '1' },
  });
  fs.closeSync(fd);
  let maThoat = null;
  con.on('exit', (code) => { maThoat = code ?? 1; });
  con.unref();

  const docMoi = () => fs.readFileSync(FILE_LOG).subarray(dau).toString('utf8');
  for (let da = 0; da < choMs; da += 300) {
    await ngu(300);
    const moi = docMoi();
    const xong = moi.indexOf('Tắt: npm run dung');
    if (xong >= 0) {
      log(moi.slice(0, xong).trimEnd());
      log(`\nTrợ lý đang chạy ngầm (tiến trình ${con.pid}), vẫn chạy khi đóng cửa sổ này. Nhật ký: data/bot.log. Tắt: npm run dung`);
      return con.pid;
    }
    if (maThoat !== null) throw new Error(`Trợ lý dừng ngay khi khởi động:\n${moi.trim()}`);
  }
  throw new Error(`Trợ lý chưa báo kết nối Zalo sau ${choMs / 1000} giây. Xem data/bot.log (tiến trình ${con.pid} vẫn chạy, tắt bằng npm run dung).`);
}
