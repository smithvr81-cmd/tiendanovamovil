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
function quote({testMode=false,saved=true,phone='999999999'}={}) {
 const source=read('components/ProvinceQuote.jsx').replace(/import .*?;\n/g,'').replace('export default function ProvinceQuote','function ProvinceQuote').split('  return <div id="contacto"')[0]+' return {submit}; }';
 let hook=0;const calls=[],events=[],opened=[],state=[];
 const context={useState:initial=>{const i=hook++;return [i===1?'PRUEBA CIUDAD':initial,v=>state[i]=v];},useRef:v=>({current:v}),useEffect:()=>{},crypto:{randomUUID:()=> 'unit-lead-id'},FormData:class{get(k){return k==='name'?(testMode?'PRUEBA NO CONTACTAR UNIT':'Unit contact'):phone;}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},window:{location:{href:'https://example.test/ofertas-provincia'},open:(...a)=>opened.push(a),dispatchEvent:e=>events.push(e)},localStorage:{getItem:()=>'{"gclid":"old-ad-click"}'},fetch:async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,saved})};}};
 vm.createContext(context);vm.runInContext(source+'\nglobalThis.quote=ProvinceQuote({products:[{name:"Redmi Note 15",price:900,priceVerified:true}]});',context);
 return {submit:()=>context.quote.submit({preventDefault(){},currentTarget:{}}),calls,events,opened,state};
}
test('quote submits once, keeps product and city, opens correct WhatsApp',async()=>{const q=quote();await q.submit();await q.submit();assert.equal(q.calls.length,1);assert.equal(q.calls[0].interest,'Redmi Note 15 | Destino: PRUEBA CIUDAD');assert.equal(q.calls[0].budget,'Equipo S/ 900; envío aparte');assert.match(q.opened[0][0],/^https:\/\/wa.me\/51953587927\?text=/);assert.equal(q.events.length,1);assert.equal(q.events[0].detail.lead_id,'unit-lead-id');});
test('synthetic form writes one tagged lead with no WhatsApp or ad attribution',async()=>{const q=quote({testMode:true});await q.submit();assert.equal(q.calls.length,1);assert.equal(q.calls[0].source,'verification_test');assert.equal(q.calls[0].gclid,undefined);assert.equal(q.opened.length,0);assert.equal(q.events[0].detail.test_mode,true);});
test('failed form save produces no lead conversion and no retry',async()=>{const q=quote({saved:false});await q.submit();await q.submit();assert.equal(q.calls.length,1);assert.equal(q.events.length,0);});
test('invalid phone blocks submission',async()=>{const q=quote({phone:'123'});await q.submit();assert.equal(q.calls.length,0);assert.equal(q.opened.length,0);});
test('WhatsApp analytics omit personal message query',()=>{const t=tracker();t.window.open('https://wa.me/51953587927?text=Name%20Private%20Phone%20999999999');const event=t.calls.find(x=>x[1]==='whatsapp_click');assert.equal(event[2].link_url,'https://wa.me/51953587927');assert.ok(!JSON.stringify(event).includes('Private'));});
test('distinct saved lead IDs are not dropped by legacy time throttle',()=>{const t=tracker();for(const lead_id of ['first','second']) t.events['tnm-lead-saved']({detail:{lead_id}});assert.equal(t.calls.filter(x=>x[1]==='conversion').length,2);});
