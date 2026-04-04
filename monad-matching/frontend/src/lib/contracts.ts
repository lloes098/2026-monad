import { zeroAddress, type Address } from "viem";

export function getMatchingEngineAddress(): Address | undefined {
  const raw = import.meta.env.VITE_MATCHING_ENGINE_ADDRESS?.trim();
  if (!raw || raw.length !== 42 || !raw.startsWith("0x")) return undefined;
  if (raw.toLowerCase() === zeroAddress.toLowerCase()) return undefined;
  return raw as Address;
}

export function getZKPBadgeAddress(): Address | undefined {
  const raw = import.meta.env.VITE_ZKP_BADGE_ADDRESS?.trim();
  if (!raw || raw.length !== 42 || !raw.startsWith("0x")) return undefined;
  if (raw.toLowerCase() === zeroAddress.toLowerCase()) return undefined;
  return raw as Address;
}
