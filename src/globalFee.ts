// FILE: src/globalFee.ts
const GUILD_FEE_LIMIT_EGLD = 500;
let guildFeeSpent = 0;

export function addGuildFee(amount: number) {
  guildFeeSpent += amount;
}

export function getGuildFeeSpent() {
  return guildFeeSpent;
}

export function guildFeeLimitReached() {
  return guildFeeSpent >= GUILD_FEE_LIMIT_EGLD;
}
