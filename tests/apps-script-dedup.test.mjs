import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8');
const inquiry = {name:'Synthetic test', phone:'999999999', interest:'Model test | Destino: Test city', budget:'Por definir', lead_id:'synthetic-1'};
function harness({rows=[Array(27).fill('header')],busy=false,throwOnAppend=false,throwOnFlush=false}={}) {
  let held=false, released=0, flushes=0;
  const writes=[];
  const sheet={
    getLastRow:()=>rows.length,
    getRange:(row,col,count,width)=>({
      getValues:()=>rows.slice(row-1,row-1+count).map(r=>r.slice(col-1,col-1+width)),
      createTextFinder:value=>({matchEntireCell(){return this;},useRegularExpression(){return this;},findAll(){
        assert.equal(held,true);
        return rows.map((r,i)=>({r,i})).filter(({r,i})=>i>=row-1&&i<row-1+count&&r[col-1]===value).map(({i})=>({getRow:()=>i+1}));
      }})
    }),
    appendRow:row=>{assert.equal(held,true);if(throwOnAppend)throw Error('synthetic failure');writes.push(row);rows.push(row.map(value=>String(value).startsWith("'") ? String(value).slice(1) : value));}
  };
  const context={LockService:{getScriptLock:()=>({tryLock:()=>{if(busy||held)return false;held=true;return true;},releaseLock:()=>{held=false;released++;}})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush:()=>{assert.equal(held,true);flushes++;if(throwOnFlush)throw Error('ambiguous flush');}},ContentService:{createTextOutput:text=>({setMimeType:()=>JSON.parse(text)}),MimeType:{JSON:'json'}}};
  vm.createContext(context);vm.runInContext(source+'\nglobalThis.handle=doPost;',context);
  return {rows,writes,send:data=>context.handle({postData:{contents:JSON.stringify(data)}}),get held(){return held;},get released(){return released;},get flushes(){return flushes;}};
}
test('same ID retried uses durable AA row and appends once',()=>{
  const h=harness();assert.equal(h.send(inquiry).saved,true);const result=h.send(inquiry);
  assert.deepEqual(result,{ok:true,saved:true,duplicate:true,lead_id:inquiry.lead_id});assert.equal(h.rows.length,2);assert.equal(h.flushes,1);assert.equal(h.released,2);assert.equal(h.held,false);
});
test('dedup survives new runtime sharing sheet rows, not process cache',()=>{
  const first=harness();first.send(inquiry);const next=harness({rows:first.rows});assert.equal(next.send(inquiry).duplicate,true);assert.equal(next.rows.length,2);
});
for(const field of ['phone','name','interest','budget'])test('same ID cannot merge different '+field,()=>{
  const h=harness();h.send(inquiry);const changed={...inquiry,[field]:field==='phone'?'988888888':'Different inquiry'};
  assert.equal(h.send(changed).error,'lead_id_conflict');assert.equal(h.rows.length,2);
});
test('phone formatting and insignificant whitespace preserve same inquiry',()=>{
  const h=harness();h.send(inquiry);assert.equal(h.send({...inquiry,phone:'+51 999-999-999',name:'  SYNTHETIC   test '}).duplicate,true);
});
test('different IDs are distinct inquiries, even same phone',()=>{
  const h=harness();h.send(inquiry);assert.equal(h.send({...inquiry,lead_id:'synthetic-2'}).saved,true);assert.equal(h.rows.length,3);
});
test('legacy missing IDs append normally and historical rows are not modified',()=>{
  const h=harness();const legacy={...inquiry,lead_id:''};h.send(legacy);const before=JSON.stringify(h.rows[1]);h.send(legacy);assert.equal(h.rows.length,3);assert.equal(JSON.stringify(h.rows[1]),before);
});
test('lock contention returns unconfirmed without writing or releasing someone else lock',()=>{
  const h=harness({busy:true});assert.equal(h.send(inquiry).error,'lead_store_busy');assert.equal(h.rows.length,1);assert.equal(h.released,0);
});
test('failure releases lock, never reports confirmed save',()=>{
  const h=harness({throwOnAppend:true});assert.equal(h.send(inquiry).saved,false);assert.equal(h.released,1);assert.equal(h.rows.length,1);
});
test('ambiguous failure after append can be safely recognized on retry',()=>{
  const h=harness({throwOnFlush:true});assert.equal(h.send(inquiry).saved,false);assert.equal(h.rows.length,2);assert.equal(h.send(inquiry).duplicate,true);assert.equal(h.rows.length,2);
});
test('AA and commercial columns retain positions',()=>{
  const h=harness();h.send(inquiry);const row=h.rows[1];assert.equal(row.length,27);assert.equal(row[18],'Nuevo');assert.ok(row.slice(19,26).every(v=>v===''));assert.equal(row[26],inquiry.lead_id);
});
test('invalid required fields never acquire a lock or append',()=>{
  const h=harness();assert.equal(h.send({}).error,'missing_required_fields');assert.equal(h.rows.length,1);assert.equal(h.released,0);
});
test('empty sheet also recognizes its first appended row on retry',()=>{
  const h=harness({rows:[]});h.send(inquiry);assert.equal(h.send(inquiry).duplicate,true);assert.equal(h.rows.length,1);
});
test('historical duplicate ID with conflicting inquiry is never acknowledged as same lead',()=>{
  const h=harness();h.send(inquiry);h.rows.push([...h.rows[1]]);h.rows[2][2]='988888888';assert.equal(h.send(inquiry).error,'lead_id_conflict');assert.equal(h.rows.length,3);
});

test('international phone is written literally and equivalent retry still deduplicates',()=>{
  const h=harness();h.send({...inquiry,phone:'+51 999 999 999'});
  assert.equal(h.writes[0][2],"'+51 999 999 999");assert.equal(h.rows[1][2],'+51 999 999 999');
  assert.equal(h.send(inquiry).duplicate,true);assert.equal(h.rows.length,2);
});
test('formula-like values are escaped in every untrusted sheet column',()=>{
  const h=harness();const data={...inquiry};
  const fields=['submitted_at','name','phone','interest','budget','source','campaign','utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid','fbclid','landing_page','referrer'];
  fields.forEach((key,i)=>data[key]=['=1+1','+123','@SUM(1)','-1','  =1+1'][i%5]);
  assert.equal(h.send(data).saved,true);
  fields.forEach((key,i)=>assert.equal(h.writes[0][i],"'"+data[key]));
  assert.equal(h.send(data).duplicate,true);
});
test('ordinary strings and existing historical rows remain unchanged',()=>{
  const h=harness();h.send(inquiry);assert.equal(h.writes[0][1],inquiry.name);assert.equal(h.writes[0][2],inquiry.phone);
  const snapshot=JSON.stringify(h.rows);h.send(inquiry);assert.equal(JSON.stringify(h.rows),snapshot);
});
