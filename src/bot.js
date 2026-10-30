// Vòng chạy chính: nghe tin Zalo, chuyển tin của nhóm được giao cho đúng agent, gửi câu trả lời.
import fs from 'node:fs';
import path from 'node:path';
import { THU_MUC_DATA, timAgent } from './cau-hinh.js';
import { DUOI_ANH, gioVietNam, hoiAgent } from './agent.js';
import { dongBoTatCa } from './dong-bo.js';
import { docLichSu, ghiTin } from './lich-su.js';
import { ThreadType, guiAnh, guiTin, ketNoi, noiDungTin, tenNhom } from './zalo.js';

export const CHO_GOM_TIN_MS = { nhom: 6000, rieng: 3000 }; // đợi khách nhắn xong rồi trả lời một lần
const NHUONG_NGUOI_THAT_MS = 30 * 60 * 1000; // nhân viên vừa nhắn bằng nick này thì agent nhường 30 phút
const TOI_DA_CHAY_CUNG_LUC = 2;
const TOI_DA_TIN_MOI_GIO = 60;
const NHAC_DANG_SOAN_MS = 4000; // bong bóng "đang soạn tin" của Zalo tắt sau vài giây, phải gửi lại
const TOI_DA_LUOT_MOI_CUOC_MOI_GIO = 20; // chống spam: một người nhắn dồn dập không làm tốn lượt AI
const TOI_DA_KY_TU_MOI_TIN = 2000;
const MA_NICK_MO_NOI_KHAC = [3000, 3003]; // DuplicateConnection, KickConnection của zca-js
export const CHO_NOI_LAI_GIAY = [5, 15, 30, 60, 120]; // mất kết nối lần thứ n thì đợi bấy nhiêu giây rồi nối lại

export const gio = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(11, 19);
const cat = (s, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s).replace(/\n/g, ' ⏎ ');
const TOI_DA_BONG_BONG = 3;

/** Tách câu trả lời thành vài tin ngắn như người nhắn (ngăn bởi dòng trống), tối đa 3 tin. */
export function tachBongBong(text) {
  const phan = String(text).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (phan.length <= TOI_DA_BONG_BONG) return phan;
  return [...phan.slice(0, TOI_DA_BONG_BONG - 1), phan.slice(TOI_DA_BONG_BONG - 1).join('\n\n')];
}

/** Chỉ giữ ảnh có thật, nằm trong bộ não, dưới 10 MB. Trả về đường dẫn tuyệt đối. */
export function anhHopLe(boNao, dsAnh) {
  const goc = path.resolve(boNao);
  return dsAnh
    .map((a) => path.resolve(goc, a))
    .filter((f) => f.startsWith(goc + path.sep) && DUOI_ANH.test(f) && fs.existsSync(f) && fs.statSync(f).size < 10 * 1024 * 1024);
}

/** Ghi câu hỏi agent chưa có dữ liệu vào Chờ Duyệt của bộ não (theo luật: AI chỉ ghi vào Chờ Duyệt). */
export function ghiCauHoiThieu(ch, { noiChat, ten, cauHoi }) {
  const choDuyet = path.join(ch.bo_nao, '6. Company Brain OS', '4. Triển Khai & Chăm Sóc Khách Hàng', 'Chờ Duyệt');
  const thuMuc = fs.existsSync(choDuyet) ? choDuyet : THU_MUC_DATA;
  fs.mkdirSync(thuMuc, { recursive: true });
  const f = path.join(thuMuc, 'Câu hỏi agent chưa trả lời được.md');
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, [
      '---', 'trang-thai: cho-duyet', 'nguon: Trợ lý Zalo ghi lại câu khách hỏi mà bộ não chưa có dữ liệu', '---', '',
      '# Câu hỏi agent chưa trả lời được', '',
      'Bổ sung câu trả lời vào đúng phòng trong bộ não rồi đánh dấu [x]. Lần sau agent sẽ trả lời được.', '', '',
    ].join('\n'));
  }
  const { ngay, gio: g } = gioVietNam();
  fs.appendFileSync(f, `- [ ] ${g} ${ngay.split(', ')[1]} · ${noiChat} · ${ten}: ${cauHoi.replace(/\n/g, ' ')}\n`);
}

function taoKhoa(toiDa) {
  let dang = 0;
  const cho = [];
  return async (viec) => {
    if (dang >= toiDa) await new Promise((r) => cho.push(r));
    dang++;
    try {
      return await viec();
    } finally {
      dang--;
      cho.shift()?.();
    }
  };
}

/** api, hoi, gui: chỉ truyền vào khi chạy test (Zalo giả, agent giả). */
export async function chayBot(ch, { log = console.log, api: apiCo, hoi = hoiAgent, guiZalo = guiTin, guiAnhZalo = guiAnh } = {}) {
  const api = apiCo ?? await ketNoi();
  const toi = String(await api.getOwnId());
  // Tên Zalo của nick, để agent hiểu "@tên" trong nhóm là đang gọi chính nó.
  let tenNick = '';
  try {
    const p = (await api.fetchAccountInfo?.())?.profile;
    tenNick = String(p?.displayName || p?.zaloName || '').trim();
  } catch { /* không có tên thì thôi */ }
  const agentCuaNhom = new Map();
  for (const a of ch.agents) for (const n of a.nhom) agentCuaNhom.set(n, a);
  const md = ch.mac_dinh;
  const agentMacDinh = md.agent ? timAgent(ch, md.agent) : null;
  const khoa = taoKhoa(TOI_DA_CHAY_CUNG_LUC);

  const hang = new Map(); // threadId -> { tin: [], hen, dangChay, chayLai }
  const botVuaGui = []; // { threadId, noi_dung, ts }: để nhận ra tin vọng lại của chính bot
  const nhuongDen = new Map(); // threadId -> thời điểm agent được trả lời lại
  const nhomChuaGiao = new Set();
  const daGuiTrongGio = [];
  const luotTheoCuoc = new Map(); // threadId -> các mốc gọi agent trong 1 giờ
  const vuotLuot = (threadId) => {
    const moc = (luotTheoCuoc.get(threadId) ?? []).filter((t) => t > Date.now() - 3600_000);
    luotTheoCuoc.set(threadId, moc);
    if (moc.length >= TOI_DA_LUOT_MOI_CUOC_MOI_GIO) return true;
    moc.push(Date.now());
    return false;
  };

  const coTheGui = () => {
    const mocGio = Date.now() - 3600_000;
    while (daGuiTrongGio.length && daGuiTrongGio[0] < mocGio) daGuiTrongGio.shift();
    return daGuiTrongGio.length < TOI_DA_TIN_MOI_GIO;
  };

  /** Gửi câu trả lời thành vài tin ngắn (trích dẫn tin khách ở tin đầu khi trong nhóm), rồi gửi ảnh. */
  async function gui(threadId, loai, text, quote, agent, anh = []) {
    if (!coTheGui()) {
      log(`[${gio()}] ⚠ Đã gửi ${TOI_DA_TIN_MOI_GIO} tin trong 1 giờ, tạm dừng gửi để bảo vệ nick.`);
      return false;
    }
    const bongBong = tachBongBong(text);
    for (const [i, phan] of bongBong.entries()) {
      botVuaGui.push({ threadId, noi_dung: phan, ts: Date.now() });
      if (botVuaGui.length > 50) botVuaGui.shift();
      await guiZalo(api, threadId, loai, phan, i === 0 ? quote : undefined);
    }
    daGuiTrongGio.push(Date.now());
    ghiTin(threadId, { id: `bot-${Date.now()}`, ts: Date.now(), ten: agent.ten, noi_dung: text, la_bot: true });
    if (anh.length) {
      try {
        await guiAnhZalo(api, threadId, loai, anh);
        ghiTin(threadId, { id: `bot-anh-${Date.now()}`, ts: Date.now(), ten: agent.ten, noi_dung: `[Ảnh: ${anh.map((f) => path.basename(f)).join(', ')}]`, la_bot: true });
      } catch (err) {
        log(`[${gio()}] Không gửi được ảnh: ${err.message}`);
      }
    }
    return true;
  }

  async function baoCao(text) {
    if (!ch.nhom_bao_cao) return;
    try {
      await guiZalo(api, ch.nhom_bao_cao, ThreadType.Group, text);
    } catch (err) {
      log(`[${gio()}] Không gửi được cảnh báo vào nhóm báo cáo: ${err.message}`);
    }
  }

  async function xuLy(threadId) {
    const h = hang.get(threadId);
    if (!h || !h.tin.length) return;
    if (h.dangChay) {
      h.chayLai = true;
      return;
    }
    if (vuotLuot(threadId)) {
      h.tin.splice(0);
      log(`[${gio()}] ⚠ ${threadId} nhắn quá ${TOI_DA_LUOT_MOI_CUOC_MOI_GIO} lượt trong 1 giờ, tạm bỏ qua để tránh spam.`);
      return;
    }
    h.dangChay = true;
    const tinMoi = h.tin.splice(0);
    const { agent, loai, noiChat, nhap } = tinMoi[tinMoi.length - 1];
    const idMoi = new Set(tinMoi.map((t) => t.id));
    const lichSu = docLichSu(threadId, 40).filter((t) => !idMoi.has(t.id)).slice(-25);
    const duocGoi = tinMoi.some((t) => t.duocGoi);
    // Hiện "đang soạn tin" suốt lúc agent nghĩ khi gần như chắc sẽ trả lời (tin riêng, hoặc được tag trong nhóm).
    let dangSoan;
    if (!nhap && (loai === ThreadType.User || duocGoi)) {
      const soan = () => Promise.resolve(api.sendTypingEvent?.(threadId, loai)).catch(() => {});
      soan();
      dangSoan = setInterval(soan, NHAC_DANG_SOAN_MS);
    }
    try {
      const kq = await khoa(() => hoi({
        ch, agent,
        tinhHuong: {
          noiChat, lichSu, tinMoi, tenNick,
          ghiChu: loai === ThreadType.Group && duocGoi
            ? 'Trong tin mới có người tag bạn hoặc trả lời vào tin của bạn: họ đang gọi bạn, hãy đáp lại (kể cả khi chỉ là lời gọi), trừ khi rõ ràng không cần.'
            : '',
        },
      }));
      clearInterval(dangSoan);
      const nhan = { tra_loi: 'TRẢ LỜI', bo_qua: 'IM LẶNG', chuyen_nguoi: 'CHUYỂN NGƯỜI THẬT' }[kq.hanh_dong];
      log(`[${gio()}] → ${agent.ten} (${kq.giay}s) ${nhan}${nhap && kq.tin_nhan && kq.hanh_dong !== 'bo_qua' ? ' [NHÁP, chưa gửi]' : ''}`);
      if (kq.tin_nhan && kq.hanh_dong !== 'bo_qua') log(`   ${kq.tin_nhan.replace(/\n/g, '\n   ')}`);
      const anh = kq.hanh_dong === 'bo_qua' ? [] : anhHopLe(ch.bo_nao, kq.anh ?? []);
      if (anh.length) log(`   ${nhap ? '[NHÁP] ' : ''}ảnh: ${anh.map((f) => path.basename(f)).join(', ')}`);
      if (kq.ly_do) log(`   (lý do: ${cat(kq.ly_do)})`);

      const cuoi = tinMoi[tinMoi.length - 1];
      if (kq.hanh_dong !== 'bo_qua' && kq.tin_nhan && !nhap && !(nhuongDen.get(threadId) > Date.now())) {
        await gui(threadId, loai, kq.tin_nhan, loai === ThreadType.Group ? cuoi.data : undefined, agent, anh);
      }
      if (kq.hanh_dong === 'chuyen_nguoi') {
        const canhBao = `🔔 Cần người hỗ trợ: ${noiChat}\nKhách: ${cuoi.ten}: ${cat(cuoi.noi_dung, 300)}\nViệc cần làm: ${kq.ly_do || '(agent không ghi)'}`;
        if (nhap) log(`   [NHÁP] cảnh báo cho nhóm báo cáo: ${cat(canhBao, 300)}`);
        else await baoCao(canhBao);
      }
      if (kq.cau_hoi_thieu_du_lieu) {
        ghiCauHoiThieu(ch, { noiChat, ten: cuoi.ten, cauHoi: kq.cau_hoi_thieu_du_lieu });
        log(`   (đã ghi câu hỏi thiếu dữ liệu vào Chờ Duyệt: ${cat(kq.cau_hoi_thieu_du_lieu, 120)})`);
      }
    } catch (err) {
      log(`[${gio()}] ✖ ${agent.ten} lỗi: ${err.message}`);
    } finally {
      clearInterval(dangSoan);
      h.dangChay = false;
      if (h.chayLai || h.tin.length) {
        h.chayLai = false;
        setTimeout(() => xuLy(threadId), 500);
      }
    }
  }

  api.listener.on('message', async (m) => {
    try {
      const threadId = String(m.threadId);
      const laNhom = m.type === ThreadType.Group;
      // Nhóm hoặc người được giao rõ trong "nhom" của agent thì theo agent đó; còn lại theo mac_dinh.
      let agent = agentCuaNhom.get(threadId);
      const theoMacDinh = !agent;
      if (!agent && !laNhom && md.chat_rieng) agent = agentMacDinh;
      // Nhóm chưa giao: agent mặc định chỉ trả lời khi được tag, và không ghi log từng tin của nhóm.
      const nhomMacDinh = laNhom && !agent && md.nhom_khi_duoc_tag && Boolean(agentMacDinh);
      if (nhomMacDinh) agent = agentMacDinh;
      const nhap = (theoMacDinh ? (laNhom ? md.che_do_nhom ?? md.che_do : md.che_do) : agent?.che_do) !== 'tu-gui';
      let noi_dung = noiDungTin(m.data);
      if (noi_dung.length > TOI_DA_KY_TU_MOI_TIN) noi_dung = `${noi_dung.slice(0, TOI_DA_KY_TU_MOI_TIN)}… (tin quá dài, đã cắt bớt)`;
      const ts = Number(m.data.ts) || Date.now();
      const id = String(m.data.msgId || m.data.cliMsgId || ts);

      if (!agent) {
        if (laNhom && !nhomChuaGiao.has(threadId)) {
          nhomChuaGiao.add(threadId);
          log(`[${gio()}] (nhóm chưa giao agent: "${await tenNhom(api, threadId)}" id ${threadId})`);
        }
        return;
      }

      // "#thu <câu hỏi>" gõ từ chính nick này: đóng vai khách để tự thử agent.
      const tinThu = m.isSelf ? noi_dung.match(/^\s*[#/]thu\s+([\s\S]+)/i) : null;
      if (m.isSelf && !tinThu) {
        const i = botVuaGui.findIndex((b) => b.threadId === threadId && b.noi_dung.trim() === noi_dung.trim());
        if (i >= 0) {
          botVuaGui.splice(i, 1);
          return;
        }
        // Nhân viên nhắn bằng chính nick này: agent nhường, không chen vào.
        ghiTin(threadId, { id, ts, ten: 'Nhân viên (nick này)', noi_dung, la_bot: false });
        nhuongDen.set(threadId, Date.now() + NHUONG_NGUOI_THAT_MS);
        hang.get(threadId)?.tin.splice(0);
        if (!nhomMacDinh) log(`[${gio()}] Bạn vừa nhắn bằng nick này trong ${laNhom ? `nhóm "${await tenNhom(api, threadId)}"` : 'tin riêng'}, agent nhường 30 phút. (Muốn tự thử thì gõ: #thu <câu hỏi>)`);
        return;
      }
      if (tinThu) {
        nhuongDen.delete(threadId);
        noi_dung = tinThu[1].trim();
      }

      const ten = tinThu ? 'Khách (thử)' : m.data.dName || 'Khách';
      ghiTin(threadId, { id, ts, ten, noi_dung, la_bot: false });
      const duocGoi = !laNhom || Boolean(tinThu)
        || (m.data.mentions ?? []).some((x) => String(x.uid) === toi)
        || String(m.data.quote?.ownerId ?? '') === toi;
      if (nhomMacDinh && !duocGoi) return;
      const noiChat = laNhom ? `nhóm Zalo "${await tenNhom(api, threadId)}"` : `tin nhắn riêng Zalo với "${ten}"`;
      log(`[${gio()}] ${laNhom ? noiChat : 'Tin riêng'} · ${ten}: ${cat(noi_dung)}`);

      if (nhuongDen.get(threadId) > Date.now()) return;
      if (agent.tra_loi_khi === 'khi-duoc-goi' && !duocGoi) return;

      if (!hang.has(threadId)) hang.set(threadId, { tin: [], hen: null, dangChay: false, chayLai: false });
      const h = hang.get(threadId);
      h.tin.push({ id, ts, ten, noi_dung, la_bot: false, data: m.data, agent, loai: m.type, noiChat, duocGoi, nhap });
      clearTimeout(h.hen);
      h.hen = setTimeout(() => xuLy(threadId), laNhom ? CHO_GOM_TIN_MS.nhom : CHO_GOM_TIN_MS.rieng);
    } catch (err) {
      log(`[${gio()}] Lỗi khi nhận tin: ${err.message}`);
    }
  });

  // Mạng chập chờn, máy ngủ dậy: tự kết nối lại. Nick mở ở nơi khác (3000, 3003) thì dừng, không giành lại.
  let lanNoiLai = 0;
  api.listener.on('connected', () => {
    if (lanNoiLai) log(`[${gio()}] Đã kết nối lại Zalo.`);
    lanNoiLai = 0;
  });
  api.listener.on('error', (err) => log(`[${gio()}] Lỗi kết nối Zalo: ${String(err?.message ?? err)}`));
  api.listener.on('closed', (code) => {
    if (MA_NICK_MO_NOI_KHAC.includes(code)) {
      log(`[${gio()}] Zalo ngắt kết nối vì nick vừa mở ở nơi khác (mã ${code}). Mỗi nick chỉ chạy được ở một nơi: tắt nơi kia rồi chạy lại npm run chay-nen.`);
      process.exitCode = 1;
      return;
    }
    const giay = CHO_NOI_LAI_GIAY[Math.min(lanNoiLai, CHO_NOI_LAI_GIAY.length - 1)];
    lanNoiLai++;
    log(`[${gio()}] Mất kết nối Zalo (mã ${code}). Thử kết nối lại sau ${giay} giây (lần ${lanNoiLai}).`);
    setTimeout(() => {
      try { api.listener.start({ retryOnClose: true }); } catch (err) { log(`[${gio()}] Không kết nối lại được: ${err.message}`); }
    }, giay * 1000);
  });
  api.listener.start({ retryOnClose: true });

  if (ch.dong_bo.nguon.length && ch.dong_bo.moi_phut > 0) {
    setInterval(() => dongBoTatCa(ch, { log: (s) => log(`[${gio()}] ${s}`) }), ch.dong_bo.moi_phut * 60_000).unref();
  }
  return { api, toi };
}
