// FILE: src/classifier.ts
import fetch from 'node-fetch';
import { ClassificationResult } from './types';
import { LLM_ENDPOINT } from './config';
import { log } from './logger';

const SYSTEM_PROMPT = `
You are an intent classifier for a blockchain game.
Decide if the admin message means:
- GREEN: send as many transactions as possible.
- RED: stop sending transactions.
- NO_CHANGE: unrelated or ambiguous.

Respond ONLY as JSON:
{ "intent": "GREEN" | "RED" | "NO_CHANGE", "confidence": 0.0-1.0 }
`.trim();

async function callLLM(message: string, previousState: 'GREEN' | 'RED'): Promise<ClassificationResult> {
  const userPrompt = `Current state: ${previousState}\nAdmin message: ${message}`;
  const res = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT, userPrompt }),
  });
  if (!res.ok) throw new Error(`LLM error: ${res.status}`);
  const text = await res.text();
  const parsed = JSON.parse(text);
  return { intent: parsed.intent, confidence: parsed.confidence };
}

export async function classifyAdminMessage(
  message: string,
  previousState: 'GREEN' | 'RED'
): Promise<ClassificationResult> {
  try {
    const result = await callLLM(message, previousState);
    log('[classifier]', { message, ...result, previousState });
    return result;
  } catch (err: any) {
    log('[classifier] error, NO_CHANGE fallback', err.message  err);
    return { intent: 'NO_CHANGE', confidence: 0 };
  }
}
