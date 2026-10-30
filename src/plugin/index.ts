import path from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { createTools } from './tools.js'
import { openBankrec } from './storage.js'
export const name='dsh-bankrec'; export const inject=['tools','storageDomain']
export async function apply(ctx:Context):Promise<void>{const baseDir=process.env.DSH_BANKREC_HOME??path.join(process.env.DSH_HOME??process.cwd(),'storages','dsh-bankrec');const{transactions,matches}=await openBankrec(ctx);for(const t of createTools({transactions,matches,baseDir}))ctx.tools.register(t)}
