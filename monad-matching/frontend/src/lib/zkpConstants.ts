/** ZKPBadge.sol 의 THRESHOLD(10 ether) 와 동일해야 증명이 검증됩니다 */
export const ZKP_THRESHOLD_WEI = 10n * 10n ** 18n;

const base =
  import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

export const ZKP_WASM_URL = `${base}zkp/balance_proof.wasm`;
export const ZKP_ZKEY_URL = `${base}zkp/circuit_final.zkey`;
