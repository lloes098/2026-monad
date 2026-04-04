#!/usr/bin/env bash
# circom + snarkjs 로 회로 빌드 후 Groth16Verifier.sol 및 프론트용 wasm/zkey 생성
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v circom >/dev/null 2>&1 || {
  echo "circom 이 PATH 에 없습니다. https://docs.circom.io/getting-started/installation/"
  exit 1
}

mkdir -p circuits/build
cd circuits

circom balance_proof.circom --r1cs --wasm --sym -o build

npx snarkjs powersoftau new bn128 12 build/pot12_0000.ptau -v
npx snarkjs powersoftau contribute build/pot12_0000.ptau build/pot12_0001.ptau \
  --name="first" -v -e="contribution1"
npx snarkjs powersoftau prepare phase2 build/pot12_0001.ptau build/pot12_final.ptau -v

npx snarkjs groth16 setup build/balance_proof.r1cs build/pot12_final.ptau build/circuit_0000.zkey
npx snarkjs zkey contribute build/circuit_0000.zkey build/circuit_final.zkey \
  --name="second" -v -e="contribution2"

npx snarkjs zkey export verificationkey build/circuit_final.zkey build/verification_key.json
npx snarkjs zkey export solidityverifier build/circuit_final.zkey "$ROOT/contracts/Groth16Verifier.sol"

mkdir -p "$ROOT/frontend/public/zkp"
cp build/balance_proof_js/balance_proof.wasm "$ROOT/frontend/public/zkp/balance_proof.wasm"
cp build/circuit_final.zkey "$ROOT/frontend/public/zkp/circuit_final.zkey"

echo "OK: contracts/Groth16Verifier.sol, frontend/public/zkp/*"
