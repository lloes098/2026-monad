#!/usr/bin/env bash
# age_check.circom / age_range.circom 빌드
# → AgeCheckVerifier.sol, AgeRangeVerifier.sol 생성
# → frontend/public/zkp/age_check.wasm, age_check_final.zkey 등 복사
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v circom >/dev/null 2>&1 || {
  echo "circom 이 PATH 에 없습니다. https://docs.circom.io/getting-started/installation/"
  exit 1
}

mkdir -p circuits/build
cd circuits

# ── age_check ──────────────────────────────────────────────────────
echo "=== Building age_check ==="
circom "$ROOT/contracts/age_check.circom" --r1cs --wasm --sym -o build

npx snarkjs powersoftau new bn128 12 build/age_pot12_0000.ptau -v
npx snarkjs powersoftau contribute build/age_pot12_0000.ptau build/age_pot12_0001.ptau \
  --name="age_first" -v -e="age_contribution1"
npx snarkjs powersoftau prepare phase2 build/age_pot12_0001.ptau build/age_pot12_final.ptau -v

npx snarkjs groth16 setup build/age_check.r1cs build/age_pot12_final.ptau build/age_check_0000.zkey
npx snarkjs zkey contribute build/age_check_0000.zkey build/age_check_final.zkey \
  --name="age_second" -v -e="age_contribution2"
npx snarkjs zkey export verificationkey build/age_check_final.zkey build/age_check_vkey.json
npx snarkjs zkey export solidityverifier build/age_check_final.zkey "$ROOT/contracts/AgeCheckVerifier.sol"

mkdir -p "$ROOT/frontend/public/zkp"
cp build/age_check_js/age_check.wasm "$ROOT/frontend/public/zkp/age_check.wasm"
cp build/age_check_final.zkey "$ROOT/frontend/public/zkp/age_check_final.zkey"
echo "age_check done"

# ── age_range ──────────────────────────────────────────────────────
echo "=== Building age_range ==="
circom "$ROOT/contracts/age_range.circom" --r1cs --wasm --sym -o build

npx snarkjs groth16 setup build/age_range.r1cs build/age_pot12_final.ptau build/age_range_0000.zkey
npx snarkjs zkey contribute build/age_range_0000.zkey build/age_range_final.zkey \
  --name="range_second" -v -e="range_contribution2"
npx snarkjs zkey export verificationkey build/age_range_final.zkey build/age_range_vkey.json
npx snarkjs zkey export solidityverifier build/age_range_final.zkey "$ROOT/contracts/AgeRangeVerifier.sol"

cp build/age_range_js/age_range.wasm "$ROOT/frontend/public/zkp/age_range.wasm"
cp build/age_range_final.zkey "$ROOT/frontend/public/zkp/age_range_final.zkey"
echo "age_range done"

echo ""
echo "OK: AgeCheckVerifier.sol, AgeRangeVerifier.sol 생성됨"
echo "다음: npx hardhat run scripts/deploy-age.ts --network monadTestnet"
