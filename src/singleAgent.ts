// FILE: src/singleAgent.ts
import { txLoopFactory } from './txEngine';
import { AgentMetrics } from './types';

export interface AgentConfig {
  id: string;
  address: string;
  privateKey: string;
  feeLimitEgld: number;
  role: 'sprinter' | 'steady' | 'sniper';
}

export type AgentMetricsSink = (metrics: AgentMetrics) => void;
export function startAgent(cfg: AgentConfig, report: AgentMetricsSink) {
  let state: 'GREEN' | 'RED' = 'RED';
  let permitted = 0;
  let unpermitted = 0;
  let feeSpent = 0;
  let lastAdminMessage: string | undefined;
  let lastAdminIntent: any;
  let lastAdminConfidence: number | undefined;
  let lastTxAt: number | undefined;
  let lastError: string | undefined;

  const txLoop = txLoopFactory({
    id: cfg.id,
    privateKey: cfg.privateKey,
    senderAddress: cfg.address,
    feeLimitEgld: cfg.feeLimitEgld,
    role: cfg.role,
    onTx: (fee, isPermitted) => {
      feeSpent += fee;
      if (isPermitted) permitted++;
      else unpermitted++;
      lastTxAt = Date.now();
      pushMetrics();
    },
    onError: err => {
      lastError = err;
      pushMetrics();
    },
  });

  function pushMetrics() {
    const score = permitted - unpermitted;
    const metrics: AgentMetrics = {
      id: cfg.id,
      state,
      permitted,
      unpermitted,
      score,
      feeSpent,
      tps: 0,
      lastAdminMessage,
      lastAdminIntent,
      lastAdminConfidence,
      lastTxAt,
      lastError,
      updatedAt: Date.now(),
    };
    report(metrics);
  }

  txLoop();
}
