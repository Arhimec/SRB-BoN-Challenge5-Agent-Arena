// FILE: src/bonSigner.ts
import fetch from 'node-fetch';
import { Address, Account, Transaction, TransactionPayload, UserSigner } from '@multiversx/sdk-core';
import { BON_GATEWAY_API, TARGET_ADDRESS } from './config';
import { loadBonNetworkConfig } from './bonNetwork';
import { log } from './logger';

export async function sendBonTx(
  privateKeyHex: string,
  senderBech32: string,
  value: string,
  data?: string
) {
  const cfg = await loadBonNetworkConfig();
  const sender = new Address(senderBech32);
  const account = new Account(sender);

  const nonceRes = await fetch(${BON_GATEWAY_API}/address/${senderBech32});
  if (!nonceRes.ok) throw new Error(Nonce fetch failed: ${nonceRes.status});
  const nonceBody = await nonceRes.json();
  account.nonce = BigInt(nonceBody.data?.account?.nonce  0);

  const payload = data ? new TransactionPayload(data) : new TransactionPayload();
  const tx = new Transaction({
    nonce: account.nonce,
    value,
    receiver: new Address(TARGET_ADDRESS),
    sender,
    gasPrice: cfg.minGasPrice,
    gasLimit: cfg.defaultGasLimit,
    chainID: cfg.chainID,
    data: payload,
  });

  const signer = UserSigner.fromSecretKey(Buffer.from(privateKeyHex, 'hex'));
  await signer.sign(tx);
  const raw = tx.toSendable();

  const res = await fetch(`${BON_GATEWAY_API}/transaction/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(raw),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BoN tx send failed: ${res.status} ${text}`);
  }

  const body = await res.json();
  const txHash = body.data?.txHash;
  log('[BoN] tx sent:', txHash);
  return txHash;
}
