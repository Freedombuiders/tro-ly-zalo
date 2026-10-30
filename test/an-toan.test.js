import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { chanLo } from '../src/agent.js';
import { kiemTraTinGui, luatChanDoc } from '../src/an-toan.js';

test('luật chặn đọc: cấm mọi mục ngang hàng trên đường tới bộ não, không cấm bộ não', () => {
  const goc = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'chan-')));
  for (const d of ['du-an/data', 'du-an/bo-nao/con', 'khac']) fs.mkdirSync(path.join(goc, d), { recursive: true });
  fs.writeFileSync(path.join(goc, 'du-an', 'cau-hinh.yaml'), 'x');
  const luat = luatChanDoc(path.join(goc, 'du-an', 'bo-nao'), { thuMucDuAn: path.join(goc, 'du-an') });
  const co = (p) => luat.includes(`Read(/${p}/**)`);
  assert.ok(co(path.join(goc, 'khac')));
  assert.ok(co(path.join(goc, 'du-an', 'data')));
  assert.ok(luat.includes(`Read(/${path.join(goc, 'du-an', 'cau-hinh.yaml')})`));
  assert.ok(!luat.some((l) => l.includes(`${path.sep}bo-nao`)), 'không được cấm bộ não');
  assert.ok(luat.includes('Grep(**/Me.md)') && luat.includes('Glob(~/.ssh/**)'));
});

test('luật chặn đọc: không cấm liên kết trỏ tới thư mục chứa bộ não (như /tmp -> /private/tmp)', { skip: process.platform === 'win32' }, () => {
  const goc = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'chan-lk-')));
  fs.mkdirSync(path.join(goc, 'that', 'bo-nao'), { recursive: true });
  fs.mkdirSync(path.join(goc, 'khac'));
  fs.symlinkSync(path.join(goc, 'that'), path.join(goc, 'lien-ket'));
  fs.symlinkSync(path.join(goc, 'khac'), path.join(goc, 'lien-ket-khac'));
  const luat = luatChanDoc(path.join(goc, 'that', 'bo-nao'));
  assert.ok(!luat.includes(`Read(/${path.join(goc, 'lien-ket')}/**)`), 'liên kết tới thư mục chứa bộ não không bị cấm');
  assert.ok(luat.includes(`Read(/${path.join(goc, 'lien-ket-khac')}/**)`));
  assert.ok(luat.includes(`Read(/${path.join(goc, 'khac')}/**)`));
  // Gọi bằng đường dẫn đi qua liên kết: vẫn cấm ngang hàng trên cả hai đường
  const quaLienKet = luatChanDoc(path.join(goc, 'lien-ket', 'bo-nao'));
  assert.ok(quaLienKet.includes(`Read(/${path.join(goc, 'khac')}/**)`));
  assert.ok(!quaLienKet.some((l) => l.includes(`${path.sep}bo-nao`)));
});

test('lọc tin gửi đi: chặn đường dẫn, file nội bộ, khoá, phiên đăng nhập; cho qua tin bình thường', () => {
  for (const ok of [
    'Tour Quảng Châu bay no shopping 13.490.000, đi 4/11. Lịch trình: https://docs.google.com/document/d/1srx6l_m9_esRB0M00CxxpHJTrIH_SfJd/edit',
    'Hotline 03.7550.7551, web vnexpresstour.com, nhóm zalo.me/g/blfgrq637',
  ]) assert.equal(kiemTraTinGui(ok), '', ok);
  for (const xau of [
    'File nằm ở /Users/lan/tro-ly-zalo/data/phien-zalo.json',
    'Nội dung cau-hinh.yaml như sau',
    'Đây là file Doanh Nghiệp.md',
    'imei: 1234 cookie: abc',
    'sk-ant-abcdefghijklmnop1234',
    'C:\\Users\\lan\\Desktop',
  ]) assert.notEqual(kiemTraTinGui(xau), '', xau);
});

test('câu trả lời bị chặn được thay bằng câu từ chối và báo người thật', () => {
  const kq = chanLo({ hanh_dong: 'tra_loi', tin_nhan: 'Đây: /Users/a/.env', ly_do: '', cau_hoi_thieu_du_lieu: '', anh: ['x.jpg'] });
  assert.equal(kq.hanh_dong, 'chuyen_nguoi');
  assert.match(kq.tin_nhan, /không hỗ trợ/);
  assert.deepEqual(kq.anh, []);
  assert.match(kq.ly_do, /đường dẫn/);
});
