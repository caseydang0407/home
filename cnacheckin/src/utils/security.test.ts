import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, verifyLocationCodeLocal } from './security';

test('sha256Hex normalizes case and whitespace', async () => {
  const a = await sha256Hex('sac-cna-2026');
  const b = await sha256Hex('  SAC-CNA-2026 ');
  assert.equal(a, b);
});

test('verifyLocationCodeLocal validates each California chapter independently', async () => {
  const okSac = await verifyLocationCodeLocal('Sacramento', 'SAC-CNA-2026');
  assert.equal(okSac.authorized, true);

  const wrongForSf = await verifyLocationCodeLocal('San Francisco', 'SAC-CNA-2026');
  assert.equal(wrongForSf.authorized, false);
  assert.ok(wrongForSf.error?.includes('Invalid access code'));

  const okSf = await verifyLocationCodeLocal('San Francisco', 'SF-CNA-2026');
  assert.equal(okSf.authorized, true);

  const okLa = await verifyLocationCodeLocal('Los Angeles', 'LA-CNA-2026');
  assert.equal(okLa.authorized, true);

  const okIrv = await verifyLocationCodeLocal('Irvine', 'IRV-CNA-2026');
  assert.equal(okIrv.authorized, true);

  const okSd = await verifyLocationCodeLocal('San Diego', 'SD-CNA-2026');
  assert.equal(okSd.authorized, true);
});

test('verifyLocationCodeLocal rejects empty input', async () => {
  const empty = await verifyLocationCodeLocal('Irvine', '   ');
  assert.equal(empty.authorized, false);
});
