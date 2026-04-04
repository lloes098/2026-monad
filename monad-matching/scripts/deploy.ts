import { network } from "hardhat";

async function main() {
  const connection = await network.connect({
    network: "monadTestnet",
  });
  console.log(`Connected to ${connection.networkName}...`);
  const { viem } = connection;

  const now = new Date();
  const year = BigInt(now.getUTCFullYear());
  const month = BigInt(now.getUTCMonth() + 1);
  console.log(`Current date: ${year}-${month} (UTC)`);

  // ── 1. Verifier (잔액 ZKP) ──────────────────────────────────────
  console.log("\nDeploying Groth16Verifier (balance)...");
  const balanceVerifier = await viem.deployContract("contracts/Groth16Verifier.sol:Groth16Verifier");
  console.log("Groth16Verifier:", balanceVerifier.address);

  // ── 2. ZKPBadge (잔액 10 MON 이상) ─────────────────────────────
  console.log("Deploying ZKPBadge...");
  const zkpBadge = await viem.deployContract("ZKPBadge", [balanceVerifier.address]);
  console.log("ZKPBadge:", zkpBadge.address);

  // ── 3. MatchingEngine (Escrow 포함) ────────────────────────────
  console.log("Deploying MatchingEngine...");
  const matching = await viem.deployContract("MatchingEngine");
  console.log("MatchingEngine:", matching.address);

  // ── 4. AgeBadge verifier들은 circom 빌드 후 별도 배포 필요 ──────
  //    npm run zkp:build:age 실행 후 AgeCheckVerifier / AgeRangeVerifier 배포
  //    현재는 스킵

  console.log(`
────────────────────────────────────────────
프론트 .env:
VITE_MATCHING_ENGINE_ADDRESS=${matching.address}
VITE_ZKP_BADGE_ADDRESS=${zkpBadge.address}
────────────────────────────────────────────
`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
