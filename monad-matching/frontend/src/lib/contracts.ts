import { zeroAddress, type Address } from "viem";

function parseAddress(raw: string | undefined): Address | undefined {
  if (!raw || raw.length !== 42 || !raw.startsWith("0x")) return undefined;
  if (raw.toLowerCase() === zeroAddress.toLowerCase()) return undefined;
  return raw as Address;
}

export function getMatchingEngineAddress(): Address | undefined {
  return parseAddress(import.meta.env.VITE_MATCHING_ENGINE_ADDRESS?.trim());
}

export function getZKPBadgeAddress(): Address | undefined {
  return parseAddress(import.meta.env.VITE_ZKP_BADGE_ADDRESS?.trim());
}

export function getAdultBadgeAddress(): Address | undefined {
  return parseAddress(import.meta.env.VITE_ADULT_BADGE_ADDRESS?.trim());
}

export function getAgeRangeBadgeAddress(): Address | undefined {
  return parseAddress(import.meta.env.VITE_AGE_RANGE_BADGE_ADDRESS?.trim());
}
