import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface LedgerEntry {
  type: string;
  id: string;
  test: string;
  cleanup: 'delete' | 'close' | 'none';
  status: 'created' | 'cleaned' | 'cleanup-failed' | 'left';
}

/** Append-only JSONL record of everything a run creates: `ledger/<runId>.jsonl`. */
export class Ledger {
  private readonly file: string;
  constructor(runId: string, dir = 'ledger') {
    mkdirSync(dir, { recursive: true });
    this.file = join(dir, `${runId}.jsonl`);
  }
  write(e: LedgerEntry): void {
    appendFileSync(this.file, `${JSON.stringify({ ...e, at: new Date().toISOString() })}\n`);
  }
}
