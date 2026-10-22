import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const sample = { name: 'Synthetic Customer', phone: '999999991', interest: 'Model Alpha | Destino: Lima', budget: 'Por definir' };
function storage() { let value = null; return { getItem: () => value, setItem: (_, next) => { value = next; }, value: () => value }; }
function helper({ store = storage(), fetchImpl, now = 10000000 } = {}) {
  const calls = []; let clock = now;
  const context = { crypto: webcrypto, TextEncoder, Uint8Array, Date: { now: () => clock }, sessionStorage: store,
    fetch: async (url, options) => { calls.push(JSON.parse(options.body)); return fetchImpl ? fetchImpl(url, options) : { ok: true, json: async () => ({ ok: true, saved: true }) }; }
  };
  vm.createContext(context);
  vm.runInContext(read('lib/leadSubmission.mjs').replaceAll('export ', '') + '\nglobalThis.api = { submitLeadOnce, inquiryKey, suggestedInterest };', context);
  return { ...context.api, calls, store, advance: ms => { clock += ms; } };
}
test('generic helper concurrent identical submits and later repeats send one stable ID', async () => {
  const h = helper(); const results = await Promise.all([h.submitLeadOnce(sample), h.submitLeadOnce(sample)]);
  const repeat = await h.submitLeadOnce({ ...sample, phone: '+51 999 999 991', name: ' Synthetic   Customer ' });
  assert.equal(h.calls.length, 1); assert.equal(results[0].lead_id, results[1].lead_id); assert.equal(repeat.lead_id, results[0].lead_id); assert.equal(repeat.saved, true); assert.equal(repeat.duplicate, true); assert.equal(results.filter(r => r.duplicate).length, 1);
});
test('generic session ledger stores digest and metadata but no raw customer data', async () => {
  const h = helper(); await h.submitLeadOnce(sample); const value = h.store.value();
  for (const raw of ['Synthetic', '999999991', 'Model Alpha', 'Lima']) assert.ok(!value.includes(raw));
  assert.match(Object.keys(JSON.parse(value))[0], /^[a-f0-9]{64}$/);
});
test('generic reload does not replay ambiguous network failure', async () => {
  const store = storage(); const first = helper({ store, fetchImpl: async () => { throw Error('network'); } });
  const result = await first.submitLeadOnce(sample); assert.equal(result.saved, false);
  const second = helper({ store }); const replay = await second.submitLeadOnce(sample);
  assert.equal(second.calls.length, 0); assert.equal(replay.lead_id, result.lead_id); assert.equal(replay.saved, false);
});
test('generic reload does not replay unconfirmed or non-JSON response', async () => {
  for (const fetchImpl of [async () => ({ ok: true, json: async () => ({ ok: true, saved: false }) }), async () => ({ ok: true, json: async () => { throw Error('invalid JSON'); } })]) {
    const store = storage(); const a = helper({ store, fetchImpl }); await a.submitLeadOnce(sample);
    const b = helper({ store }); assert.equal((await b.submitLeadOnce(sample)).saved, false); assert.equal(b.calls.length, 0);
  }
});
test('generic distinct phones, models, cities, budgets stay distinct', async () => {
  const h = helper(); const payloads = [sample, { ...sample, phone: '999999992' }, { ...sample, interest: 'Model Beta | Destino: Lima' }, { ...sample, interest: 'Model Alpha | Destino: Piura' }, { ...sample, budget: 'S/ 900' }];
  const result = await Promise.all(payloads.map(p => h.submitLeadOnce(p)));
  assert.equal(h.calls.length, 5); assert.equal(new Set(result.map(r => r.lead_id)).size, 5);
});
test('different concurrent inquiries survive out-of-order completion and reload', async () => {
  const store = storage(); const releases = [];
  const h = helper({ store, fetchImpl: () => new Promise(resolve => releases.push(() => resolve({ ok: true, json: async () => ({ ok: true, saved: true }) }))) });
  const a = h.submitLeadOnce(sample), other = { ...sample, phone: '999999992' }, b = h.submitLeadOnce(other);
  while (releases.length < 2) await new Promise(resolve => setTimeout(resolve, 1));
  releases[1](); await new Promise(resolve => setTimeout(resolve, 1)); releases[0](); await Promise.all([a, b]);
  const reloaded = helper({ store }); await reloaded.submitLeadOnce(sample); await reloaded.submitLeadOnce(other);
  assert.equal(reloaded.calls.length, 0);
});
test('storage denied still has in-memory repeat and concurrency protection', async () => {
  const h = helper({ store: { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } } });
  await Promise.all([h.submitLeadOnce(sample), h.submitLeadOnce(sample)]); await h.submitLeadOnce(sample); assert.equal(h.calls.length, 1);
});
test('same inquiry after thirty minute window gets new ID', async () => {
  const h = helper(); const a = await h.submitLeadOnce(sample); h.advance(30 * 60 * 1000 + 1); const b = await h.submitLeadOnce(sample);
  assert.equal(h.calls.length, 2); assert.notEqual(a.lead_id, b.lead_id);
});
test('product and cart message suggestions preserve meaningful interests', () => {
  const h = helper(); assert.equal(h.suggestedInterest('Hola, me interesa Samsung A16 128GB. Estoy en [ciudad]. ¿Precio?'), 'Samsung A16 128GB');
  assert.equal(h.suggestedInterest('Hola, deseo cotizar este pedido:\n• Model Alpha'), 'Cotizar los productos de mi carrito'); assert.equal(h.suggestedInterest('Hola, quiero cotizar un celular'), '');
});
function gate({ fields = {}, saved = true, resultImpl, message = 'Hola, me interesa Model Alpha. Estoy en [ciudad].', attrs = {}, blockedPopup = false } = {}) {
  const values = { name: 'Synthetic Customer', phone: '999999991', city: 'Piura', interest: 'Model Alpha', budget: '', ...fields };
  const calls = [], opened = [], events = [], state = []; let hook = 0;
  const url = 'https://wa.me/51953587927?text=' + encodeURIComponent(message);
  const context = { URL, Date, useState: initial => { const i = hook++; return [i === 0 ? url : initial, value => { state[i] = value; }]; }, useRef: current => ({ current }), useEffect: fn => fn(),
    FormData: class { get(key) { return values[key]; } }, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    window: { location: { href: 'https://example.test/' }, open: (...args) => { if (blockedPopup) throw Error('popup blocked'); opened.push(args); }, dispatchEvent: e => events.push(e) },
    document: { referrer: '', addEventListener() {}, removeEventListener() {} }, localStorage: { getItem: () => JSON.stringify(attrs) },
    submitLeadOnce: async payload => { calls.push(payload); return resultImpl ? resultImpl(payload) : { saved, lead_id: 'mock-stable-id' }; }, suggestedInterest: helper().suggestedInterest
  };
  const source = read('components/WhatsAppLeadGate.jsx').replace(/^import .*;$/gm, '').replace('export default function WhatsAppLeadGate', 'function WhatsAppLeadGate').split('  if (!pendingUrl) return null;')[0] + '\nreturn { submit, close }; }\nglobalThis.gate = WhatsAppLeadGate();';
  vm.createContext(context); vm.runInContext(source, context);
  return { submit: () => context.gate.submit({ preventDefault() {}, currentTarget: {} }), close: context.gate.close, calls, opened, events, state };
}
test('generic gate submits required city/model, optional budget and matching enriched WhatsApp', async () => {
  const g = gate(); await g.submit(); assert.equal(g.calls.length, 1); assert.equal(g.calls[0].interest, 'Model Alpha | Destino: Piura'); assert.equal(g.calls[0].budget, 'Por definir'); assert.equal(g.calls[0].phone, '+51999999991');
  const url = new URL(g.opened[0][0]); assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, '/51953587927'); const message = url.searchParams.get('text');
  assert.match(message, /me interesa Model Alpha/); assert.match(message, /Estoy en Piura/); assert.match(message, /Ciudad \/ provincia: Piura/); assert.match(message, /Modelo \/ necesidad: Model Alpha/); assert.equal(g.events[0].detail.lead_id, 'mock-stable-id');
});
for (const field of ['name', 'phone', 'city', 'interest']) test('generic gate blocks missing ' + field, async () => { const g = gate({ fields: { [field]: '   ' } }); await g.submit(); assert.equal(g.calls.length, 0); assert.equal(g.opened.length, 0); });
test('generic gate accepts meaningful recommendation and supplied budget', async () => { const g = gate({ fields: { interest: 'Quiero una recomendación', budget: 'S/ 800' } }); await g.submit(); assert.equal(g.calls[0].interest, 'Quiero una recomendación | Destino: Piura'); assert.equal(g.calls[0].budget, 'S/ 800'); });
test('generic gate synchronous guard blocks rapid concurrent submits', async () => { const g = gate(); await Promise.all([g.submit(), g.submit()]); assert.equal(g.calls.length, 1); assert.equal(g.opened.length, 1); });
test('generic gate failed/unconfirmed save opens WhatsApp but never emits saved conversion', async () => { const g = gate({ saved: false }); await g.submit(); assert.equal(g.opened.length, 1); assert.equal(g.events.length, 0); });
test('generic gate attribution cannot replace customer fields or source', async () => { const g = gate({ attrs: { name: 'old', phone: 'old', interest: 'old', source: 'old', gclid: 'synthetic-click' } }); await g.submit(); assert.equal(g.calls[0].name, 'Synthetic Customer'); assert.equal(g.calls[0].source, 'whatsapp_gate'); assert.equal(g.calls[0].gclid, 'synthetic-click'); });
test('generic gate does not double-decode percent signs in message', async () => { const g = gate({ message: 'Hola, me interesa Model Alpha. Descuento 10%25 disponible.' }); await g.submit(); assert.match(new URL(g.opened[0][0]).searchParams.get('text'), /10%25/); });

for (const phone of ['999 999 991', '+51 999 999 991', '(+51) 999-999-991']) test('generic formatted phone accepted: ' + phone, async () => { const g = gate({ fields: { phone } }); await g.submit(); assert.equal(g.calls.length, 1); assert.equal(g.calls[0].phone, '+51999999991'); });
for (const phone of ['899999991', '999999991x', '+1 999999991', '99999999']) test('generic malformed phone rejected: ' + phone, async () => { const g = gate({ fields: { phone } }); await g.submit(); assert.equal(g.calls.length, 0); assert.equal(g.opened.length, 0); });
test('generic blocked popup retains manual continuation with one saved event', async () => { const g = gate({ blockedPopup: true }); await g.submit(); assert.equal(g.calls.length, 1); assert.equal(g.events.length, 1); assert.match(g.state[3], /^https:\/\/wa.me\/51953587927\?text=/); });
test('generic close before submit writes nothing', () => { const g = gate(); g.close(); assert.equal(g.calls.length, 0); assert.equal(g.state[0], ''); });
test('generic close during in-flight submission is ignored', async () => { let release; const g = gate({ resultImpl: () => new Promise(resolve => { release = resolve; }) }); const request = g.submit(); g.close(); assert.notEqual(g.state[0], ''); release({ saved: true, lead_id: 'mock-id' }); await request; assert.equal(g.calls.length, 1); assert.equal(g.events.length, 1); });

test('generic gate cached saved duplicate does not emit a second conversion', async () => { const g = gate({ resultImpl: async () => ({ saved: true, lead_id: 'existing-id', duplicate: true }) }); await g.submit(); assert.equal(g.events.length, 0); assert.equal(g.opened.length, 1); });
function contactCapture({fields={}, duplicate=false, saved=true, managed=false}={}) {
 const values={...sample,city:'Lima',interest:'Model Alpha',...fields}; const calls=[], events=[], handlers={}; let prevented=false,stopped=false,validity='';
 class Form { closest(){return {};} dataset={leadCapture:managed?'managed':undefined}; elements={namedItem:()=>({setCustomValidity:v=>validity=v,reportValidity(){}})}; }
 const context={useEffect:fn=>fn(),HTMLFormElement:Form,FormData:class{get(key){return values[key];}},localStorage:{getItem:()=>null},window:{location:{pathname:'/',href:'https://example.test/'},dispatchEvent:e=>events.push(e)},document:{referrer:'',addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},submitLeadOnce:async p=>{calls.push(p);return {saved,duplicate,lead_id:'capture-id'};}};
 vm.createContext(context);vm.runInContext(read('components/LeadCapture.jsx').replace(/^import .*;$/gm,'').replace('export default function LeadCapture','function LeadCapture')+'\nLeadCapture();',context);
 return {async submit(){handlers.submit({target:new Form(),preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});await Promise.resolve();},calls,events,blocked:()=>prevented&&stopped,validity:()=>validity};
}
test('generic contact capture forwards required city/model and same stable event ID',async()=>{const c=contactCapture();await c.submit();assert.equal(c.calls.length,1);assert.equal(c.calls[0].interest,'Model Alpha | Destino: Lima');assert.equal(c.calls[0].phone,'+51999999991');assert.equal(c.events[0].detail.lead_id,'capture-id');});
test('generic contact capture ignores managed A16 form',async()=>{const c=contactCapture({managed:true});await c.submit();assert.equal(c.calls.length,0);assert.equal(c.events.length,0);});
test('generic contact capture blocks invalid phone, city and model',async()=>{for(const fields of [{phone:'123'},{city:' '},{interest:' '}]){const c=contactCapture({fields});await c.submit();assert.equal(c.calls.length,0);assert.equal(c.events.length,0);assert.equal(c.blocked(),true);}});
test('generic contact capture duplicate or unconfirmed result never reconverts',async()=>{for(const options of [{duplicate:true},{saved:false}]){const c=contactCapture(options);await c.submit();assert.equal(c.calls.length,1);assert.equal(c.events.length,0);}});
