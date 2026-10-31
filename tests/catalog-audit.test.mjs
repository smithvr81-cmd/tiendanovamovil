import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('data/products.js');
const products = JSON.parse(source.slice(source.indexOf('['), source.lastIndexOf(']') + 1));
const audit = JSON.parse(read('data/catalog-audits/2026-10-31.json'));
test('all 28 catalog identities retained with dated evidence', () => {
 assert.equal(products.length, 28); assert.equal(new Set(products.map(p=>p.id)).size,28);
 assert.equal(audit.products.length,28);
 for (const p of products) { assert.equal(p.priceCheckedAt,'2026-10-31'); assert.ok(audit.products.some(a=>a.id===p.id)); assert.equal(p.stock,null); }
});
test('verified prices equal publicly sourced price plus 100; unverified prices never leak', () => {
 for(const p of products) {
  const a=audit.products.find(a=>a.id===p.id);
  if(p.priceVerified) { assert.equal(p.price,(a.supplierPrice ?? a.sourcePricePEN)+100); assert.notEqual(a.isPurchaseable,false); }
  else assert.equal(p.price,null);
  assert.equal(p.oldPrice,null);
 }
 assert.match(read('app/page.js'),/i.priceVerified \? currency\(i.price\) : 'Consultar precio'/);
});
test('catalog photos are local assets and old mismatched supplier SKUs are absent', () => {
 for (const p of products) { assert.ok(p.image.startsWith('/')); assert.ok(existsSync(new URL('../public'+p.image,import.meta.url))); }
 assert.ok(!products.some(p=>/128304459|123780095/.test(p.image)));
});

test('homepage carousel does not advertise withdrawn HONOR price', () => {
 assert.ok(!read('components/VideoShowcase.jsx').includes('cJbb1VciAKg'));
 assert.ok(!read('components/VideoShowcase.jsx').includes('S/ 1,350'));
});
