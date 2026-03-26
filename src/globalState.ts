// FILE: src/globalState.ts
import { LightState } from './types';

let currentState: LightState = 'RED';
let lastAdminMessage: string | undefined;
let lastAdminIntent: 'GREEN' | 'RED' | 'NO_CHANGE' | undefined;
let lastAdminConfidence: number | undefined;
let lastAdminAt: number | undefined;

export function getGlobalState() {
  return currentState;
}

export function setGlobalState(state: LightState) {
  currentState = state;
}

export function updateAdminContext(
  message: string,
  intent: 'GREEN' | 'RED' | 'NO_CHANGE',
  confidence: number
) {
  lastAdminMessage = message;
  lastAdminIntent = intent;
  lastAdminConfidence = confidence;
  lastAdminAt = Date.now();
}

export function getAdminContext() {
  return {
    lastAdminMessage,
    lastAdminIntent,
    lastAdminConfidence,
    lastAdminAt,
  };
}

