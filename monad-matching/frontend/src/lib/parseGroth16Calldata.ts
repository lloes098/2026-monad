/** snarkjs `groth16.exportSolidityCallData` 반환 문자열 → writeContract 인자 */
export function parseGroth16SolidityCalldata(raw: string): {
  a: readonly [bigint, bigint];
  b: readonly [
    readonly [bigint, bigint],
    readonly [bigint, bigint],
  ];
  c: readonly [bigint, bigint];
} {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string" && v.startsWith("0x")) return BigInt(v);
    if (Array.isArray(v)) return v.map(walk);
    return v;
  };

  const parsed = walk(JSON.parse(`[${raw}]`)) as unknown[];

  if (!Array.isArray(parsed) || parsed.length < 3) {
    throw new Error("Unexpected groth16 calldata shape");
  }

  const [a, b, c] = parsed;
  const tuple2 = (x: unknown): readonly [bigint, bigint] => {
    if (!Array.isArray(x) || x.length !== 2) throw new Error("Expected uint[2]");
    return [BigInt(x[0] as bigint), BigInt(x[1] as bigint)];
  };
  const tuple2x2 = (x: unknown) => {
    if (!Array.isArray(x) || x.length !== 2) throw new Error("Expected uint[2][2]");
    return [tuple2(x[0]), tuple2(x[1])] as const;
  };

  return {
    a: tuple2(a),
    b: tuple2x2(b),
    c: tuple2(c),
  };
}
