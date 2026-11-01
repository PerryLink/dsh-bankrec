import { createHash } from 'node:crypto'; import { mkdtemp, readFile, rm } from 'node:fs/promises'; import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import * as XLSX from 'xlsx'; import { createTools } from '../lib/plugin/tools.js'
class T{map=new Map();get(k){return this.map.get(k)};entries(){return this.map.entries()};get size(){return this.map.size};async put(k,v){this.map.set(k,v)}}
const n=30,b=['date,amount,reference'],g=['date,amount,reference'];for(let i=1;i<=n;i++){b.push(`2026-01-${String(i).padStart(2,'0')},${100+i}.00,B${i}`);g.push(`2026-01-${String(i+1).padStart(2,'0')},${100+i}.00,G${i}`)}
const dir=await mkdtemp(path.join(os.tmpdir(),'br-acc-')),root=process.cwd(),runId=`sku06-${Date.now()}`,ev=path.join(root,'evidence',runId);mkdirSync(ev,{recursive:true});const sha=v=>createHash('sha256').update(v).digest('hex');let rows=0,matched=0,unmatched=0,sheets=0,camtRows=0,reconciled=0,mtRows=0,ibanOk=0
try{const ts=createTools({transactions:new T(),matches:new T(),baseDir:path.join(dir,'s')});const by=Object.fromEntries(ts.map(t=>[t.name,t]));const e={callId:'a'};rows=(await by['bankrec.ingest'].execute({account_id:'A1',period:'2026-01',bank_csv:b.join('\n'),gl_csv:g.join('\n')},e)).bank_rows;const m=await by['bankrec.match'].execute({account_id:'A1',period:'2026-01'},e);matched=m.matched;unmatched=m.unmatched_bank.length+m.unmatched_gl.length;const x=await by['bankrec.export'].execute({account_id:'A1',period:'2026-01'},e);sheets=XLSX.read(await readFile(x.path),{type:'buffer'}).SheetNames.length;const camt=await by['bankrec.ingest_camt'].execute({camt_xml:readFileSync('fixtures/public/mit-camt/example-camt053-a.xml','utf8'),account_id:'CAMT'},e);camtRows=camt.rows;const rec=await by['bankrec.reconcile_camt'].execute({camt_xml:readFileSync('fixtures/public/mit-camt/test-camt053.xml','utf8')},e);reconciled=rec.balanced?1:0;const mt=await by['bankrec.ingest_mt940'].execute({mt940_text:readFileSync('fixtures/public/mit-mt940/mt940-statement.sta','utf8')},e);mtRows=mt.rows;ibanOk=(await by['bankrec.iban_check'].execute({iban:'DE89370400440532013000'},e)).valid?1:0}finally{await rm(dir,{recursive:true,force:true})}
const ms=[{i:'SKU-06-A01',m:'流水解析（30）',t:'30/30',a:rows,p:rows===30},{i:'SKU-06-A02',m:'1:1 匹配',t:'30/30',a:matched,p:matched===30},{i:'SKU-06-A03',m:'未达行',t:'0',a:unmatched,p:unmatched===0},{i:'SKU-06-A04',m:'底稿 sheet',t:'3',a:sheets,p:sheets===3},{i:'SKU-06-A05',m:'CAMT.053 公开样本行',t:'11',a:camtRows,p:camtRows===11},{i:'SKU-06-A06',m:'CAMT 余额恒等式',t:'1/1',a:reconciled,p:reconciled===1},{i:'SKU-06-A07',m:'MT940 公开样本行',t:'5',a:mtRows,p:mtRows===5},{i:'SKU-06-A08',m:'IBAN ISO 13616 mod-97',t:'1/1',a:ibanOk,p:ibanOk===1}];const res={run_id:runId,scope:'SKU-06-S1',status:'partial',counted:false,note:'synthetic; user-approved public/synthetic; 0 real firms',metrics:ms,pass:ms.every(x=>x.p)};const t=JSON.stringify(res,null,2)+'\n';writeFileSync(path.join(ev,'result.json'),t);const h=sha(t);writeFileSync(path.join(root,'ACCEPTANCE.csv'),'req_id,metric,threshold,actual,script,evidence_sha256,pass\n'+ms.map(x=>`${x.i},${x.m},${x.t},${x.a},scripts/acceptance.mjs,${h},${x.p}`).join('\n')+'\n');if(!res.pass)process.exit(1);console.log('acceptance ok',runId)


// Normalize the public-only acceptance schema: source + counted=false.
{
  const fs = await import('node:fs')
  const file = 'ACCEPTANCE.csv'
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n')
  if (!lines[0].includes('source,counted')) {
    lines[0] += ',source,counted'
    for (let i = 1; i < lines.length; i += 1) lines[i] += ',public/synthetic,false'
    fs.writeFileSync(file, lines.join('\n') + '\n')
  }
}
