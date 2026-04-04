import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  console.log(`Connected to ${connection.networkName}...`);
  const { viem } = connection;

  const now = new Date();
  const year = BigInt(now.getUTCFullYear());
  const month = BigInt(now.getUTCMonth() + 1);
  console.log(`Current date: ${year}-${month} (UTC)\n`);

  console.log("Deploying AgeCheckVerifier...");
  const ageCheckVerifier = await viem.deployContract("contracts/AgeCheckVerifier.sol:Groth16Verifier");
  console.log("AgeCheckVerifier:", ageCheckVerifier.address);

  console.log("Deploying AdultBadge...");
  const adultBadge = await viem.deployContract("AdultBadge", [
    ageCheckVerifier.address,
    year,
    month,
  ]);
  console.log("AdultBadge:", adultBadge.address);

  console.log("Deploying AgeRangeVerifier...");
  const ageRangeVerifier = await viem.deployContract("contracts/AgeRangeVerifier.sol:Groth16Verifier");
  console.log("AgeRangeVerifier:", ageRangeVerifier.address);

  console.log("Deploying AgeRangeBadge...");
  const ageRangeBadge = await viem.deployContract("AgeRangeBadge", [
    ageRangeVerifier.address,
    year,
    month,
  ]);
  console.log("AgeRangeBadge:", ageRangeBadge.address);

  console.log(`
────────────────────────────────────────────
프론트 .env에 추가:
VITE_ADULT_BADGE_ADDRESS=${adultBadge.address}
VITE_AGE_RANGE_BADGE_ADDRESS=${ageRangeBadge.address}
────────────────────────────────────────────
`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
