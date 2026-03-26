import { pollAdminCommands } from './sharedListener';
import { classifyAdminMessage } from './classifier';
import { getGlobalState, setGlobalState, updateAdminContext } from './globalState';
import { log } from './logger';

// H1 FIX: Reduced from 1000ms to 300ms for faster reaction
const POLL_INTERVAL_MS = 300;

export async function startCommandLoop() {
  log('[commandLoop] started, polling every', POLL_INTERVAL_MS, 'ms');

  while (true) {
    try {
      const cmds = await pollAdminCommands();
      for (const cmd of cmds) {
        const prev = getGlobalState();
        const result = await classifyAdminMessage(cmd.message, prev);
        updateAdminContext(cmd.message, result.intent, result.confidence);

        if (result.intent === 'GREEN' && prev !== 'GREEN') {
          log(`[state] RED → GREEN | msg="${cmd.message.slice(0, 60)}" conf=${result.confidence.toFixed(2)}`);
          setGlobalState('GREEN');
        } else if (result.intent === 'RED' && prev !== 'RED') {
          log(`[state] GREEN → RED | msg="${cmd.message.slice(0, 60)}" conf=${result.confidence.toFixed(2)}`);
          setGlobalState('RED');
        } else {
          log(`[state] no change (${prev}) | msg="${cmd.message.slice(0, 60)}" intent=${result.intent}`);
        }
      }
    } catch (err: any) {
      log('[commandLoop] error:', err.message || err);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}
