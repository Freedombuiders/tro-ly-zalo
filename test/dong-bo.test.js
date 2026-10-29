import assert from 'node:assert/strict';
import { test } from 'node:test';
import { giaTriO, linkTaiVe, trangTinhSangMarkdown } from '../src/dong-bo.js';

test('link Google Sheet đổi thành link tải xlsx', () => {
  assert.equal(
    linkTaiVe('https://docs.google.com/spreadsheets/d/1u8HhQcn8iGpj_x-Y/edit?gid=1983950487#gid=1983950487'),
    'https://docs.google.com/spreadsheets/d/1u8HhQcn8iGpj_x-Y/export?format=xlsx',
  );
  assert.equal(linkTaiVe('./du-lieu/bang-gia.xlsx'), null);
});

test('định dạng ô: ngày, tháng, tiền, link', () => {
  const ngay = new Date(Date.UTC(2026, 10, 21));
  assert.equal(giaTriO(ngay, 'NGÀY KH'), '21/11/2026');
  assert.equal(giaTriO(new Date(Date.UTC(2026, 4, 1)), 'THÁNG'), 'Tháng 5/2026');
  assert.equal(giaTriO(12990000), '12.990.000');
  assert.equal(giaTriO(1.0), '1');
  assert.equal(giaTriO({ text: 'CT 5N4D', hyperlink: 'https://x.vn/a' }), 'CT 5N4D (https://x.vn/a)');
  assert.equal(giaTriO({ formula: 'A1*2', result: 2000000 }), '2.000.000');
  assert.equal(giaTriO('dòng 1\ndòng 2'), 'dòng 1 / dòng 2');
});

test('trang tính: tìm dòng tiêu đề, nhóm tour thành mục, điền tiếp ô trống trừ cột ghi chú/chỗ', () => {
  const md = trangTinhSangMarkdown([
    ['TOUR LỆ GIANG 2026'],
    ['LƯU Ý: CHECK LẠI SỐ CHỖ'],
    ['THÁNG', 'CODE', 'TOUR', 'NGÀY KH', 'GIÁ TOUR', 'CHỖ CÒN LẠI', 'NOTE'],
    ['HÀ NỘI – LỆ GIANG 5N4D'],
    [new Date(Date.UTC(2026, 10, 1)), 'LG1', 'HÀ NỘI – LỆ GIANG', new Date(Date.UTC(2026, 10, 10)), 12990000, 0, 'ĐÓNG ĐOÀN'],
    [null, 'LG2', null, new Date(Date.UTC(2026, 10, 24)), 12990000, 8, null],
  ]);
  assert.match(md, /^TOUR LỆ GIANG 2026$/m);
  assert.match(md, /^## HÀ NỘI – LỆ GIANG 5N4D$/m);
  assert.match(md, /^- THÁNG: Tháng 11\/2026 \| CODE: LG1 \| TOUR: HÀ NỘI – LỆ GIANG \| NGÀY KH: 10\/11\/2026 \| GIÁ TOUR: 12\.990\.000 \| CHỖ CÒN LẠI: 0 \| NOTE: ĐÓNG ĐOÀN$/m);
  const lg2 = md.split('\n').find((l) => l.includes('CODE: LG2'));
  assert.match(lg2, /THÁNG: Tháng 11\/2026/);
  assert.match(lg2, /TOUR: HÀ NỘI – LỆ GIANG/);
  assert.match(lg2, /CHỖ CÒN LẠI: 8/);
  assert.doesNotMatch(lg2, /ĐÓNG ĐOÀN/);
});

test('trang tính không có bảng thì giữ nguyên các dòng chữ', () => {
  const md = trangTinhSangMarkdown([['Hotline', '0123 456 789'], ['Website', 'example.com']]);
  assert.equal(md, 'Hotline | 0123 456 789\n\nWebsite | example.com');
});

test('đồng bộ lại: thay file cũ của trang tính đã đổi tên, giữ nguyên ghi chú viết tay', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { default: ExcelJS } = await import('exceljs');
  const { dongBoNguon } = await import('../src/dong-bo.js');
  const goc = fs.mkdtempSync(path.join(os.tmpdir(), 'dong-bo-'));
  const xlsx = path.join(goc, 'bang.xlsx');
  const ghi = async (tenTrang) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(tenTrang);
    ws.addRow(['CODE', 'TOUR', 'GIÁ']);
    ws.addRow(['A1', 'Hạ Long', 3290000]);
    await wb.xlsx.writeFile(xlsx);
  };
  const ch = { bo_nao: path.join(goc, 'bo-nao') };
  const nguon = { ten: 'Bảng giá', link: xlsx, luu_vao: 'Giá' };
  const thuMuc = path.join(ch.bo_nao, 'Giá');
  await ghi('Nội địa');
  assert.equal(await dongBoNguon(ch, nguon), 1);
  fs.writeFileSync(path.join(thuMuc, 'Ghi chú tay.md'), 'của người dùng');
  await ghi('Miền Bắc');
  await dongBoNguon(ch, nguon);
  assert.deepEqual(fs.readdirSync(thuMuc).sort(), ['0. Mục lục Bảng giá.md', 'Ghi chú tay.md', 'Miền Bắc.md']);
  assert.match(fs.readFileSync(path.join(thuMuc, 'Miền Bắc.md'), 'utf8'), /- CODE: A1 \| TOUR: Hạ Long \| GIÁ: 3\.290\.000/);
});
