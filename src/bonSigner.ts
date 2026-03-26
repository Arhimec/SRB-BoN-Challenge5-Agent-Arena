import { Address, Account, Transaction, TransactionPayload, UserSigner } from '@multiversx/sdk-core';
import { BON_GATEWAY_API, TARGET_ADDRESS } from './config';
import { loadBonNetworkConfig } from './bonNetwork';
import { NonceManager } from './nonceManager';
import { log } from './logger';

/**
 * Build and sign a batch of MoveBalance transactions.
 * C1 FIX: Uses NonceManager (no per-tx nonce fetch).
 * Returns array of sendable tx objects for batch sending.
 */
export async function buildAndSignBatch(
  privateKeyHex: string,
  senderBech32: string,
  nonces: number[],
  data?: string
): Promise<any[]> {
  const cfg = await loadBonNetworkConfig();
  const sender = new Address(senderBech32);
  const signer = UserSigner.fromSecretKey(Buffer.from(privateKeyHex, 'hex'));
  const payload = data ? new TransactionPayload(data) : new TransactionPayload();

  const txs: any[] = [];
  for (const nonce of nonces) {
    const tx = new Transaction({
      nonce: BigInt(nonce),
      value: '0',
      receiver: new Address(TARGET_ADDRESS),
      sender,
      gasPrice: cfg.minGasPrice,
      gasLimit: cfg.defaultGasLimit,
      chainID: cfg.chainID,
      data: payload,
    });
    await signer.sign(tx);
    txs.push(tx.toSendable());
  }
  return txs;
}

/**
 * Send a single transaction (used for registration, funding, etc).
 * NOT for the hot path — use buildAndSignBatch + sendBatch for throughput.
 */
export async function sendSingleTx(
  privateKeyHex: string,
  senderBech32: string,
  receiver: string,
  value: string,
  data?: string,
  nonce?: number,
  gasLimit?: number
): Promise<string> {
  const cfg = await loadBonNetworkConfig();
  const sender = new Address(senderBech32);
  const signer = UserSigner.fromSecretKey(Buffer.from(privateKeyHex, 'hex'));
  const payload = data ? new TransactionPayload(data) : new TransactionPayload();

  let txNonce = nonce;
  if (txNonce === undefined) {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${BON_GATEWAY_API}/address/${senderBech32}`);
    const body: any = await res.json();
    txNonce = Number(body.data?.account?.nonce || 0);
  }

  const tx = new Transaction({
    nonce: BigInt(txNonce),
    value,
    receiver: new Address(receiver),
    sender,
    gasPrice: cfg.minGasPrice,
    gasLimit: gasLimit ?? cfg.defaultGasLimit,
    chainID: cfg.chainID,
    data: payload,
  });
  await signer.sign(tx);

  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${BON_GATEWAY_API}/transaction/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx.toSendable()),
  });
  if (!res.ok) throw new Error(`tx send failed: ${res.status} ${await res.text()}`);
  const body: any = await res.json();
  return body.data?.txHash || '';
}
