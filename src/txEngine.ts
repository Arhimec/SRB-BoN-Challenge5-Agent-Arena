// FILE: src/txEngine.ts
import { log } from './logger';
import { getGlobalState } from './globalState';
import { addGuildFee, guildFeeLimitReached } from './globalFee';
import { SIMULATION_MODE } from './config';
import { sendBonTx } from './bonSigner';

interface TxEngineConfig {
  id: string;
  privateKey: string;
  senderAddress: string;
  feeLimitEgld: number;
  role: 'sprinter' | 'steady' | 'sniper';
  onTx: (fee: number, isPermitted: boolean) => void;
  onError: (err: string) => void;
}

export function txLoopFactory(cfg: TxEngineConfig) {
  const baseDelay =
    cfg.role === 'sprinter' ? 10 :
    cfg.role === 'steady' ? 40 : 120;

  let agentFeeSpent = 0;

  async function sendSingleTx(): Promise<number> {
    if (SIMULATION_MODE) {
      const fee = 0.0001;
      log(`[tx ${cfg.id}] SIM tx`);
      return fee;
    }
    const fee = 0.0005;
    await sendBonTx(cfg.privateKey, cfg.senderAddress, '0', undefined);
    log(`[tx ${cfg.id}] real tx, fee=${fee}`);
    return fee;
  }

  return async function txLoop() {
    while (true) {
      try {
        if (guildFeeLimitReached()) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }
        if (agentFeeSpent >= cfg.feeLimitEgld) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }
        const state = getGlobalState();
        if (state === 'RED') {
          await new Promise(r => setTimeout(r, 100));
          continue;
        }
        const fee = await sendSingleTx();
        agentFeeSpent += fee;
        addGuildFee(fee);
        cfg.onTx(fee, true);
        await new Promise(r => setTimeout(r, baseDelay));
      } catch (err: any) {
        cfg.onError(err.message  String(err));
        await new Promise(r => setTimeout(r, 500));
      }
    }
  };
}
