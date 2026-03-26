// FILE: src/sharedListener.ts
import fetch from 'node-fetch';
import { BON_EXPLORER_API, ADMIN_ADDRESS, TARGET_ADDRESS } from './config';
import { log } from './logger';

let lastTimestamp = 0;

interface ExplorerTx {
  txHash: string;
  sender: string;
  receiver: string;
  data?: string;
  timestamp: number;
}

export interface AdminCommand {
  txHash: string;
  timestamp: number;
  message: string;
}

export async function pollAdminCommands(): Promise<AdminCommand[]> {
  const url = `${BON_EXPLORER_API}/accounts/${TARGET_ADDRESS}/transactions?size=50&sort=desc`;
  const res = await fetch(url);
  if (!res.ok) {
    log('[listener] error fetching txs', res.status);
    return [];
  }

  const txs: ExplorerTx[] = await res.json();
  const cmds: AdminCommand[] = [];

  for (const tx of txs) {
    if (tx.sender !== ADMIN_ADDRESS) continue;
    if (tx.timestamp <= lastTimestamp) continue;
    const msg = tx.data ? Buffer.from(tx.data, 'base64').toString('utf8') : '';
    cmds.push({ txHash: tx.txHash, timestamp: tx.timestamp, message: msg });
  }

  if (cmds.length > 0) {
    const maxTs = Math.max(...cmds.map(c => c.timestamp));
    lastTimestamp = Math.max(lastTimestamp, maxTs);
  }

  return cmds.reverse();
}
