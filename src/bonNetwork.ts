// FILE: src/bonNetwork.ts
import fetch from 'node-fetch';
import { BON_GATEWAY_API } from './config';
import { log } from './logger';

export interface BonNetworkConfig {
  chainID: string;
  minGasPrice: number;
  gasPerDataByte: number;
  defaultGasLimit: number;
}

let cachedConfig: BonNetworkConfig | null = null;

export async function loadBonNetworkConfig(): Promise<BonNetworkConfig> {
  if (cachedConfig) return cachedConfig;
