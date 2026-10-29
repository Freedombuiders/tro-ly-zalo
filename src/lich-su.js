// Lịch sử tin nhắn của từng cuộc trò chuyện, lưu thành file JSONL trong data/lich-su/ để agent nhớ ngữ cảnh.
import fs from 'node:fs';
import path from 'node:path';
import { THU_MUC_DATA } from './cau-hinh.js';

const THU_MUC = path.join(THU_MUC_DATA, 'lich-su');
const GIU_LAI = 200;

const fileCua = (threadId) => path.join(THU_MUC, `${String(threadId).replace(/[^\w-]/g, '_')}.jsonl`);

/** tin: { id, ts, ten, noi_dung, la_bot } */
export function ghiTin(threadId, tin) {
  fs.mkdirSync(THU_MUC, { recursive: true });
  const f = fileCua(threadId);
  fs.appendFileSync(f, `${JSON.stringify(tin)}\n`);
  if (fs.statSync(f).size > 400_000) {
    const con = docLichSu(threadId, GIU_LAI);
    fs.writeFileSync(f, con.map((t) => JSON.stringify(t)).join('\n') + '\n');
  }
}

export function docLichSu(threadId, soTin = 30) {
  const f = fileCua(threadId);
  if (!fs.existsSync(f)) return [];
  const tin = [];
  for (const dong of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!dong.trim()) continue;
    try { tin.push(JSON.parse(dong)); } catch { /* bỏ dòng hỏng */ }
  }
  return tin.slice(-soTin);
}
