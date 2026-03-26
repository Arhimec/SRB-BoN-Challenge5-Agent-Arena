import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { DASHBOARD_PORT } from '../src/config';
import { getAllAgentMetrics, computeGuildMetrics, updateAgentMetrics } from './metricsHub';
import { getBonHealth } from './bonHealth';
import { prometheusHandler } from './prometheus';
import { getGlobalState, getAdminContext } from '../src/globalState';
import { getGuildFeeSpent, getGuildTxCount, estimateRemainingTxs } from '../src/globalFee';
import { log } from '../src/logger';
export { updateAgentMetrics };
export function startDashboardServer() {
  const app = express(); const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });
  app.get('/metrics', prometheusHandler);
  app.get('/bon-health', async (_req, res) => { res.json(await getBonHealth()); });
  wss.on('connection', ws => {
    const send = async () => {
      ws.send(JSON.stringify({ type: 'snapshot', agents: getAllAgentMetrics(), guild: computeGuildMetrics(),
        health: await getBonHealth(), globalState: getGlobalState(), admin: getAdminContext(),
        guildFeeSpent: getGuildFeeSpent(), guildTxCount: getGuildTxCount(), remainingTxs: estimateRemainingTxs() }));
    };
    send(); const id = setInterval(send, 1000); ws.on('close', () => clearInterval(id));
  });
  server.listen(DASHBOARD_PORT, () => log(`[dashboard] :${DASHBOARD_PORT}`));
}
