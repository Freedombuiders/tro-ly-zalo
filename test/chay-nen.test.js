import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.env.TRO_LY_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'tro-ly-zalo-'));
const { FILE_PID, chayNen, dung, pidDangChay } = await import('../src/chay-nen.js');

// Bot giả: giữ chỗ như lệnh chay thật, in dòng báo sẵn sàng rồi chạy mãi.
const moDun = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/chay-nen.js')).href;
const botGia = path.join(process.env.TRO_LY_DATA, 'bot-gia.mjs');
fs.writeFileSync(botGia, `import { giuCho } from '${moDun}';
try { giuCho(); } catch (err) { console.log('✖ ' + err.message); process.exit(1); }
console.log('Trợ lý Zalo đang chạy.');
console.log('Tắt: npm run dung');
setInterval(() => {}, 1000);
`);
const botLoi = path.join(process.env.TRO_LY_DATA, 'bot-loi.mjs');
fs.writeFileSync(botLoi, "console.log('✖ Chưa đăng nhập Zalo'); process.exit(1);\n");
const conSong = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

test('chạy ngầm, khởi động lại, không cho chạy hai bản, tắt', async () => {
  const log = [];
  const pid1 = await chayNen({ lenh: [botGia], log: (s) => log.push(s), choMs: 10_000 });
  assert.equal(pidDangChay(), pid1);
  assert.match(log.join('\n'), /Trợ lý Zalo đang chạy\.[\s\S]*chạy ngầm/);

  const thuThem = spawnSync(process.execPath, [botGia], { env: process.env, encoding: 'utf8', timeout: 10_000 });
  assert.equal(thuThem.status, 1);
  assert.match(thuThem.stdout, /đang chạy rồi/);
  assert.equal(pidDangChay(), pid1);

  const pid2 = await chayNen({ lenh: [botGia], log: () => {}, choMs: 10_000 });
  assert.notEqual(pid2, pid1);
  assert.equal(conSong(pid1), false);
  assert.equal(pidDangChay(), pid2);

  assert.equal(await dung({ log: () => {} }), true);
  assert.equal(conSong(pid2), false);
  assert.equal(fs.existsSync(FILE_PID), false);
  assert.equal(await dung({ log: () => {} }), false);
});

test('trợ lý dừng ngay khi khởi động thì báo lỗi kèm nhật ký', async () => {
  await assert.rejects(chayNen({ lenh: [botLoi], log: () => {}, choMs: 10_000 }), /dừng ngay khi khởi động[\s\S]*Chưa đăng nhập Zalo/);
  assert.equal(pidDangChay(), 0);
});
