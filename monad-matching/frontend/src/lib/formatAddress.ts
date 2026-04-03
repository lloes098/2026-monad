export function shortAddress(addr: string, head = 4, tail = 4) {
  if (!addr.startsWith("0x") || addr.length < 2 + head + tail) return addr;
  return `${addr.slice(0, 2 + head)}…${addr.slice(-tail)}`;
}
