import { createHash } from 'node:crypto'
export type Lifecycle='ingested'|'matched'|'exported'
export interface Txn { txn_id:string; account_id:string; period:string; side:'bank'|'gl'; date:string; amount_cents:number; reference:string; evidence_sha256:string; created_at:string }
export interface Match { match_id:string; bank_id:string; gl_id:string; date_delta:number; amount_cents:number; created_at:string }
export type BankrecErrorCode='E_BR_CSV_INVALID'|'E_BR_ACCOUNT_MISMATCH'|'E_BR_MATCH_FAILED'|'E_BR_EXPORT_FAILED'|'E_BR_BALANCE_MISMATCH'|'E_BR_PATH_INVALID'|'E_BR_PATH_NOT_ALLOWED'
export class BankrecError extends Error { readonly code:BankrecErrorCode; constructor(code:BankrecErrorCode,message:string,next?:string){super(next?`${message}（${code}）｜下一步：${next}`:`${message}（${code}）`);this.name='BankrecError';this.code=code} }
export function sha256Hex(value:string|Buffer):string{return createHash('sha256').update(value).digest('hex')}
/** Stable 16-hex row key used to keep primary keys stable across imports. */
export function rowKey(parts:Array<string|number>):string{return sha256Hex(parts.map(String).join('|')).slice(0,16)}
/**
 * Primary key for one statement row. It carries the account, the period, a prefix of the
 * evidence hash and a stable row key, so the same file is idempotent while two different
 * files (or accounts/periods) can never silently overwrite each other.
 */
export function txnId(source:string,account:string,period:string,evidence:string,keyParts:Array<string|number>):string{return `${source}-${account}-${period}-${evidence.slice(0,12)}-${rowKey(keyParts)}`}
export function cents(raw:string):number { const v=raw.trim().replace(/[¥￥,\s]/g,''); const m=/^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(v); if(!m) throw new BankrecError('E_BR_CSV_INVALID',`金额“${raw}”读不懂`,'把金额改成 1234.56 这样的纯数字，最多两位小数'); const sign=m[1]==='-'?-1:1; return sign*(Number(m[2])*100+Number((m[3]??'').padEnd(2,'0'))) }
export function parseCsv(text:string,side:'bank'|'gl',account_id:string,period:string,evidence:string):Txn[]{
 const lines=text.trim().split(/\r?\n/).filter(Boolean); if(lines.length<2) throw new BankrecError('E_BR_CSV_INVALID','CSV needs header+rows')
 const head=lines[0]!.split(',').map(x=>x.trim().toLowerCase()); const di=head.indexOf('date'),ai=head.indexOf('amount'),ri=head.indexOf('reference');
 if(di<0||ai<0) throw new BankrecError('E_BR_CSV_INVALID','CSV 第一行缺少 date 或 amount 列','把表头写成 date,amount 或 date,amount,reference 后重跑')
 const out:Txn[]=[];
 for(const line of lines.slice(1)){const c=line.split(',').map(x=>x.trim()); const date=c[di]??''; if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new BankrecError('E_BR_CSV_INVALID',`bad date ${date}`); const amount=cents(c[ai]??''); const reference=c[ri]??''; const txn_id=txnId('csv',account_id,period,evidence,[side,date,amount,reference,out.length]); out.push({txn_id,account_id,period,side,date,amount_cents:amount,reference,evidence_sha256:evidence,created_at:new Date().toISOString()})}
 return out
}
