// FILE: src/commandLoop.ts
import { pollAdminCommands } from './sharedListener';
import { classifyAdminMessage } from './classifier';
import { getGlobalState, setGlobalState, updateAdminContext } from './globalState';
import { log } from './logger';

export async function startCommandLoop() {
  while (true) {
    try {
      const cmds = await pollAdminCommands();
      for (const cmd of cmds) {
        const prev = getGlobalState();
        const res = await classifyAdminMessage(cmd.message, prev);
        updateAdminContext(cmd.message, res.intent, res.confidence);
        if (res.intent === 'GREEN' && prev !== 'GREEN') {
          log('[state] switching to GREEN');
          setGlobalState('GREEN');
        } else if (res.intent === 'RED' && prev !== 'RED') {
          log('[state] switching to RED');
          setGlobalState('RED');
        }
      }
    } catch (err: any) {
      log('[commandLoop] error', err.message  err);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
