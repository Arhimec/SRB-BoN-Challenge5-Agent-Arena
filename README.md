// FILE: README.md
# Guild Agents — Battle of Nodes

Multi-agent orchestrator with:
- Global GREEN/RED state
- LLM intent classifier
- Global fee manager (500 EGLD cap)
- BoN explorer/gateway integration
- Real-time dashboard (React + WebSocket)
- Simulation mode

See architecture diagram, .env.example, and scripts/bon_connectivity_test.ts for setup.

//
3. Security checklist (short, practical)
- Never commit real private keys
- Use .env or secret manager
- Keep config/agents.json with dummy keys in Git
- Restrict dashboard access
- Run behind VPN or IP allowlist
- Rotate LLM API keys
- Store in secrets, not code
- Limit logging of sensitive data
- Don’t log full private keys or raw signed txs
- Use SIMULATION_MODE for testing
- Only send real txs when ready

4. Performance tuning guide (quick hits)
- Reduce WebSocket snapshot frequency
- From 1s to 2–3s if CPU is high
- Tune agent roles
- Fewer sprinters, more steady/sniper if gateway is stressed
- Batch LLM calls
- One classifier call per admin message, not per agent
- Use PM2 or Docker limits
- Cap memory/CPU per container
- Profile hot paths
- txEngine loops and listener polling
