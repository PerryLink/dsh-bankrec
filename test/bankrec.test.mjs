import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readWorkbook } from '../lib/core/xlsx-lite.js'
import { createTools } from '../lib/plugin/tools.js'
class T{map=new Map();get(k){return this.map.get(k)};entries(){return this.map.entries()};get size(){return this.map.size};async put(k,v){this.map.set(k,v)}}
const bank='date,amount,reference\n2026-01-01,100.00,A\n2026-01-03,50.00,B'
const gl='date,amount,reference\n2026-01-02,100.00,A\n2026-01-04,50.00,B'
test('ingest match export',async()=>{const d=await mkdtemp(path.join(os.tmpdir(),'br-'));try{const ts=createTools({transactions:new T(),matches:new T(),baseDir:d});const by=Object.fromEntries(ts.map(t=>[t.name,t]));const e={callId:'c'};const i=await by['bankrec.ingest'].execute({account_id:'A1',period:'2026-01',bank_csv:bank,gl_csv:gl},e);assert.equal(i.bank_rows,2);const m=await by['bankrec.match'].execute({account_id:'A1',period:'2026-01'},e);assert.equal(m.matched,2);const x=await by['bankrec.export'].execute({account_id:'A1',period:'2026-01'},e);const wb=readWorkbook(await readFile(x.path));assert.deepEqual(wb.sheets.map(s=>s.name),['Bank','GL','Matches']);assert.deepEqual(wb.sheets.map(s=>s.rows.length),[3,3,3])}finally{await rm(d,{recursive:true,force:true})}})
test('bad amount rejected',async()=>{const d=await mkdtemp(path.join(os.tmpdir(),'br-'));try{const ts=createTools({transactions:new T(),matches:new T(),baseDir:d});const by=Object.fromEntries(ts.map(t=>[t.name,t]));await assert.rejects(()=>by['bankrec.ingest'].execute({account_id:'A1',period:'2026-01',bank_csv:'date,amount\n2026-01-01,abc',gl_csv:gl},{callId:'c'}),/E_BR_CSV_INVALID/)}finally{await rm(d,{recursive:true,force:true})}})
