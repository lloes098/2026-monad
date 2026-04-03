import { isAddress } from "viem";

/** 두 지갑 주소로 스레드 키 (항상 동일한 문자열) */
export function chatThreadKey(a: string, b: string): string | null {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (!isAddress(x as `0x${string}`) || !isAddress(y as `0x${string}`)) return null;
  return x < y ? `${x}:${y}` : `${y}:${x}`;
}
