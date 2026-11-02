import { mkdir, realpath } from 'node:fs/promises'
import path from 'node:path'
import { BankrecError } from './bankrec.js'

/** A single export filename component: no separators, no whitespace, max 120 chars. */
export const SAFE_EXPORT_FILENAME = /^[A-Za-z0-9._-]{1,120}$/

/**
 * Resolve a caller-supplied export filename inside a base directory.
 *
 * 1. the filename must be one safe component (`[A-Za-z0-9._-]{1,120}`);
 * 2. the resolved path must stay below `resolve(baseDir) + sep`;
 * 3. the directory is created with `mkdir -p` and the path is re-anchored on
 *    `realpath(baseDir)` so a symlinked directory cannot redirect the write
 *    outside the canonical base.
 */
export async function safeExportPath(baseDir: string, filename: string): Promise<string> {
  if (!SAFE_EXPORT_FILENAME.test(filename)) {
    throw new BankrecError('E_BR_PATH_INVALID', `导出文件名“${filename}”含不支持的字符`, '把账户/期间改成字母、数字、- 或 _，文件名不超过 120 字符')
  }
  const base = path.resolve(baseDir)
  const candidate = path.resolve(base, filename)
  if (!candidate.startsWith(base + path.sep)) {
    throw new BankrecError('E_BR_PATH_NOT_ALLOWED', '导出文件名会写到数据目录之外', '把文件名改成不含路径分隔符的普通文件名，例如 2026-03.xlsx')
  }
  await mkdir(base, { recursive: true })
  const realBase = await realpath(base)
  const realCandidate = path.resolve(realBase, filename)
  if (!realCandidate.startsWith(realBase + path.sep)) {
    throw new BankrecError('E_BR_PATH_NOT_ALLOWED', `export path escapes base directory after realpath: ${JSON.stringify(filename)}`)
  }
  return realCandidate
}
