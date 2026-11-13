import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { Context } from '@deepseek-ai/cordis'
import { z } from 'zod'
const txn=z.object({txn_id:z.string(),account_id:z.string(),period:z.string(),side:z.enum(['bank','gl']),date:z.string(),amount_cents:z.number().int(),reference:z.string(),evidence_sha256:z.string(),created_at:z.string()})
const match=z.object({match_id:z.string(),bank_id:z.string(),gl_id:z.string(),date_delta:z.number().int(),amount_cents:z.number().int(),created_at:z.string()})
export type TxnRecord=z.infer<typeof txn>; export type MatchRecord=z.infer<typeof match>
export type Table<T>={get(k:string):T|undefined;entries():IterableIterator<[string,T]>;size:number;put(k:string,v:T):Promise<void>}
export const bankrecSpec=defineDomain({name:'bankrec',version:1,tables:{transactions:domainTable<string,TxnRecord>(txn),matches:domainTable<string,MatchRecord>(match)}})
export async function openBankrec(ctx:Context){const d=await ctx.storageDomain.open(bankrecSpec);ctx.effect(()=>()=>d.close(),'dsh-bankrec:domainClose');return{transactions:d.table('transactions') as Table<TxnRecord>,matches:d.table('matches') as Table<MatchRecord>}}
