import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function api(fetch) {
 const source = read('app/api/leads/route.js').replace("import { NextResponse } from 'next/server';", '').replace('export async function POST', 'async function POST');
 const context = { fetch, process: {env:{}}, AbortController, setTimeout, clearTimeout, NextResponse: {json:(body, options)=>({body,status:options?.status||200})} };
 vm.createContext(context); vm.runInContext(source+'\nglobalThis.POST=POST;', context); return context.POST;
}
test('one confirmed write preserves complete quote', async()=>{
 let calls=0, captured;
 const post=api(async(url, options)=>{calls++;captured=JSON.parse(options.body);return {ok:true,text:async()=>'{"ok":true}'};});
 const result=await post({json:async()=>({name:'PRUEBA NO CONTACTAR',phone:'999999999',interest:'Redmi Note 15 | Destino: PRUEBA',budget:'Equipo S/ 900; envío aparte',source:'verification_test'})});
 assert.equal(calls,1);assert.equal(result.body.saved,true);assert.equal(captured.budget,'Equipo S/ 900; envío aparte');assert.equal(captured.source,'verification_test');
});
for (const [name,response] of [ ['invalid JSON',{ok:true,text:async()=>'<html>Error</html>'}], ['server failure',{ok:false,status:500}],['unconfirmed save',{ok:true,text:async()=>'{"ok":true,"saved":false}'}], ['network failure',null]]) {
 test(name+' never retries or reports saved',async()=>{let calls=0;const post=api(async()=>{calls++;if(!response)throw new Error('network');return response;});const result=await post({json:async()=>({name:'Test',phone:'999999999'})});assert.equal(calls,1);assert.equal(result.body.saved,false);});
}
test('missing fields never reach Sheets',async()=>{let calls=0;const post=api(async()=>{calls++;});const result=await post({json:async()=>({})});assert.equal(calls,0);assert.equal(result.status,400);});
function tracker(consent='accepted') {
 const calls=[], events={},attrs={};
 const localStorage={getItem:key=>key==='tnm_analytics_consent'?consent:null,setItem:()=>{}};
 const window={location:{search:'',href:'https://example.test/ofertas-provincia'},gtag:(...args)=>calls.push(args),open:()=>{},addEventListener:(name,fn)=>events[name]=fn,removeEventListener:()=>{}};
 const document={referrer:'',querySelector:()=>({setAttribute:(k,v)=>attrs[k]=v}),getElementById:()=>null};
 const source=read('components/MarketingTracker.jsx').replace("import { useEffect } from 'react';",'').replace('export default function MarketingTracker','function MarketingTracker');
 const context={window,document,localStorage,URLSearchParams,process:{env:{}},useEffect:fn=>fn()};vm.createContext(context);vm.runInContext(source+'\nMarketingTracker();',context);
 return {calls,events,attrs,window};
}
test('saved contact emits exactly one Ads conversion with transaction ID',()=>{const t=tracker();const event={detail:{lead_id:'lead-123',event_label:'province_quote'}};t.events['tnm-lead-saved'](event);t.events['tnm-lead-saved'](event);const conversions=t.calls.filter(x=>x[1]==='conversion');assert.equal(conversions.length,1);assert.equal(conversions[0][2].transaction_id,'lead-123');assert.equal(conversions[0][2].send_to,'AW-18345503163/KUGKCN7NrN4cELvT6KtE');});
test('test contact never emits Ads even with consent',()=>{const t=tracker();t.events['tnm-lead-saved']({detail:{lead_id:'test',test_mode:true}});assert.equal(t.calls.filter(x=>x[1]==='conversion'||x[1]==='generate_lead').length,0);assert.equal(t.attrs['data-tracking-verification'],'saved-event-received-ads-suppressed');});
test('WhatsApp opening never emits Ads conversion',()=>{const t=tracker();t.window.open('https://wa.me/51953587927');assert.equal(t.calls.filter(x=>x[1]==='conversion').length,0);});
test('rejected consent never emits Ads conversion',()=>{const t=tracker('rejected');t.events['tnm-lead-saved']({detail:{lead_id:'lead-123'}});assert.equal(t.calls.filter(x=>x[1]==='conversion').length,0);});
test('managed form is excluded from global capture and no pending writes replay',()=>{assert.match(read('components/LeadCapture.jsx'),/form\.dataset\.leadCapture === 'managed'/);assert.match(read('components/ProvinceQuote.jsx'),/data-lead-capture="managed"/);assert.doesNotMatch(read('components/WhatsAppLeadGate.jsx'),/flushPendingLeads/);assert.doesNotMatch(read('components/ProvinceQuote.jsx'),/tnm_pending_leads/);});
function quote({testMode=false,saved=true,phone='999999999',blockedPopup=false,productName='Redmi Note 15'}={}) {
 const source=read('components/ProvinceQuote.jsx').replace(/import .*?;\n/g,'').replace('export default function ProvinceQuote','function ProvinceQuote').split('  return <div id="contacto"')[0]+' return {submit}; }';
 let hook=0;const calls=[],events=[],opened=[],state=[];
 const context={useState:initial=>{const i=hook++;return [i===1?'PRUEBA CIUDAD':initial,v=>state[i]=v];},useRef:v=>({current:v}),useEffect:()=>{},crypto:{randomUUID:()=> 'unit-lead-id'},FormData:class{get(k){return k==='name'?(testMode?'PRUEBA NO CONTACTAR UNIT':'Unit contact'):phone;}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},window:{location:{href:'https://example.test/ofertas-provincia'},open:(...a)=>{if(blockedPopup)throw new Error('popup blocked');opened.push(a);},dispatchEvent:e=>events.push(e)},localStorage:{getItem:()=>'{"gclid":"old-ad-click"}'},fetch:async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,saved})};}};
 vm.createContext(context);vm.runInContext(source+'\nglobalThis.quote=ProvinceQuote({products:[{name:'+JSON.stringify(productName)+',price:900,priceVerified:true}]});',context);
 return {submit:()=>context.quote.submit({preventDefault(){},currentTarget:{}}),calls,events,opened,state};
}
test('quote submits once, keeps product and city, opens correct WhatsApp',async()=>{const q=quote();await q.submit();await q.submit();assert.equal(q.calls.length,1);assert.equal(q.calls[0].interest,'Redmi Note 15 | Destino: PRUEBA CIUDAD');assert.equal(q.calls[0].budget,'Equipo S/ 900; envío aparte');assert.match(q.opened[0][0],/^https:\/\/wa.me\/51953587927\?text=/);assert.equal(q.events.length,1);assert.equal(q.events[0].detail.lead_id,'unit-lead-id');});
test('synthetic form writes one tagged lead with no WhatsApp or ad attribution',async()=>{const q=quote({testMode:true});await q.submit();assert.equal(q.calls.length,1);assert.equal(q.calls[0].source,'verification_test');assert.equal(q.calls[0].gclid,undefined);assert.equal(q.opened.length,0);assert.equal(q.events[0].detail.test_mode,true);});
test('failed form save produces no lead conversion and no retry',async()=>{const q=quote({saved:false});await q.submit();await q.submit();assert.equal(q.calls.length,1);assert.equal(q.events.length,0);});
test('invalid phone blocks submission',async()=>{const q=quote({phone:'123'});await q.submit();assert.equal(q.calls.length,0);assert.equal(q.opened.length,0);});
test('WhatsApp analytics omit personal message query',()=>{const t=tracker();t.window.open('https://wa.me/51953587927?text=Name%20Private%20Phone%20999999999');const event=t.calls.find(x=>x[1]==='whatsapp_click');assert.equal(event[2].link_url,'https://wa.me/51953587927');assert.ok(!JSON.stringify(event).includes('Private'));});
test('distinct saved lead IDs are not dropped by legacy time throttle',()=>{const t=tracker();for(const lead_id of ['first','second']) t.events['tnm-lead-saved']({detail:{lead_id}});assert.equal(t.calls.filter(x=>x[1]==='conversion').length,2);});

for (const phone of ['953 587 927','953-587-927','+51 953 587 927','(+51) 953-587-927','51 953 587 927']) {
 test('formatted phone accepted: '+phone,async()=>{const q=quote({phone});await q.submit();assert.equal(q.calls.length,1);assert.match(q.calls[0].phone,/^(\+?51)?953587927$/);assert.equal(q.calls[0].lead_id,q.events[0].detail.lead_id);});
}
for (const phone of ['953587927x','+1 953587927','95358792','9535879270','853587927']) {
 test('invalid phone remains rejected: '+phone,async()=>{const q=quote({phone});await q.submit();assert.equal(q.calls.length,0);assert.equal(q.opened.length,0);});
}
test('blocked popup does not block save and retains manual WhatsApp fallback',async()=>{const q=quote({blockedPopup:true});await q.submit();assert.equal(q.calls.length,1);assert.equal(q.events.length,1);assert.match(q.state[6],/^https:\/\/wa.me\/51953587927\?text=/);assert.match(q.state[2],/toca Enviar/);});
test('synthetic verification never exposes a contact link',async()=>{const q=quote({testMode:true,phone:'999 999 999'});await q.submit();assert.equal(q.calls[0].source,'verification_test');assert.equal(q.state[6],undefined);assert.equal(q.opened.length,0);});
test('concurrent submits still perform exactly one write',async()=>{const q=quote();await Promise.all([q.submit(),q.submit()]);assert.equal(q.calls.length,1);assert.equal(q.opened.length,1);});
test('API forwards and echoes the same lead ID without changing legacy contracts',async()=>{let captured;const post=api(async(url,options)=>{captured=JSON.parse(options.body);return {ok:true,text:async()=>'{"ok":true}'};});const result=await post({json:async()=>({name:'Test',phone:'999999999',lead_id:'unit-lead-id'})});assert.equal(captured.lead_id,'unit-lead-id');assert.equal(result.body.lead_id,'unit-lead-id');assert.equal(result.body.saved,true);});
test('API rejects malformed lead ID without dropping an otherwise valid legacy lead',async()=>{let captured;const post=api(async(url,options)=>{captured=JSON.parse(options.body);return {ok:true,text:async()=>'{"ok":true}'};});const result=await post({json:async()=>({name:'Test',phone:'999999999',lead_id:'=HYPERLINK("bad")'})});assert.equal(captured.lead_id,'');assert.equal(result.body.saved,true);});
test('quote is immediately after hero and before product browsing',()=>{const page=read('app/ofertas-provincia/page.js');assert.ok(page.indexOf('id="cotizar"')<page.indexOf('id="equipos"'));assert.match(page,/Redmi Note 15/);assert.match(page,/price: 900/);});
test('phone HTML no longer blocks formatting before normalization',()=>{const source=read('components/ProvinceQuote.jsx');assert.doesNotMatch(source,/required pattern=/);assert.match(source,/onChange=\{event => event.currentTarget.setCustomValidity\(''\)\}/);assert.match(source,/submitted && whatsappLink/);assert.match(source,/target="_blank" rel="noopener noreferrer"/);});
test('Apps Script appends ID in AA without shifting existing commercial columns',()=>{let row;const context={SpreadsheetApp:{openById:()=>({getSheetByName:()=>({appendRow:r=>row=r})})},ContentService:{createTextOutput:text=>({setMimeType:()=>JSON.parse(text)}),MimeType:{JSON:'json'}}};vm.createContext(context);vm.runInContext(read('google-apps-script/Code.gs')+'\nglobalThis.handle=doPost;',context);const result=context.handle({postData:{contents:JSON.stringify({name:'Test',phone:'999999999',lead_id:'unit-lead-id'})}});assert.equal(result.ok,true);assert.equal(row.length,27);assert.equal(row[18],'Nuevo');assert.ok(row.slice(19,26).every(v=>v===''));assert.equal(row[26],'unit-lead-id');});
test('confirmed offer contains seller-supplied memory and stock without claiming connectivity',()=>{const page=read('app/ofertas-provincia/page.js');assert.match(page,/name: 'Redmi Note 15 6GB \+ 128GB'/);assert.match(page,/6GB RAM/);assert.match(page,/Stock disponible/);assert.doesNotMatch(page,/name: 'Redmi Note 15 (4G|5G)/);});
function gateClick({continuation=false,managed=false}={}) {
 const events={},state=[];let prevented=false;let hook=0;
 const source=read('components/WhatsAppLeadGate.jsx').replace("import { useEffect, useRef, useState } from 'react';",'').replace('export default function WhatsAppLeadGate','function WhatsAppLeadGate').split('  if (!pendingUrl) return null;')[0]+' return null; }';
 const context={useEffect:fn=>fn(),useRef:value=>({current:value}),useState:value=>{const i=hook++;return [value,v=>state[i]=v];},window:{open:()=>{}},document:{addEventListener:(name,fn)=>events[name]=fn,removeEventListener:()=>{}}};vm.createContext(context);vm.runInContext(source+'\nWhatsAppLeadGate();',context);
 const link={href:'https://wa.me/51953587927?text=mock',dataset:{leadCapture:continuation?'continuation':undefined},closest:()=>managed?{}:null};events.click({target:{closest:()=>link},preventDefault:()=>prevented=true,stopPropagation:()=>{}});return {prevented,state};
}
test('managed WhatsApp fallback bypasses global recapture even after submit allowance expires',()=>{const g=gateClick({continuation:true,managed:true});assert.equal(g.prevented,false);assert.equal(g.state.length,0);assert.match(read('components/ProvinceQuote.jsx'),/data-lead-capture="continuation"/);});
test('ordinary WhatsApp links still use capture gate',()=>{const g=gateClick();assert.equal(g.prevented,true);assert.match(g.state[0],/^https:\/\/wa.me/);});
test('continuation marker outside managed form does not bypass gate',()=>{assert.equal(gateClick({continuation:true}).prevented,true);});

test('corrected offer reaches quote payload and WhatsApp text with no obsolete memory',async()=>{const page=read('app/ofertas-provincia/page.js');assert.doesNotMatch(page,/\b8GB\b|\b256GB\b/);const productName=page.match(/name: '([^']+)'/)[1];const q=quote({productName});await q.submit();assert.equal(q.calls[0].interest,'Redmi Note 15 6GB + 128GB | Destino: PRUEBA CIUDAD');const message=new URL(q.opened[0][0]).searchParams.get('text');assert.match(message,/Equipo: Redmi Note 15 6GB \+ 128GB/);assert.doesNotMatch(message,/\b8GB\b|\b256GB\b/);assert.equal(q.calls[0].budget,'Equipo S/ 900; envío aparte');});
