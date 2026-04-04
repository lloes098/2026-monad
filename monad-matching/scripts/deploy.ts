import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  console.log(`Connected to ${connection.networkName}...`);

  const { viem } = connection;

  console.log("Deploying Groth16Verifier...");
  const verifier = await viem.deployContract("Groth16Verifier");
  console.log("Groth16Verifier:", verifier.address);

  console.log("Deploying ZKPBadge...");
  const zkpBadge = await viem.deployContract("ZKPBadge", [verifier.address]);
  console.log("ZKPBadge:", zkpBadge.address);

  console.log("Deploying MatchingEngine...");
  const matching = await viem.deployContract("MatchingEngine");
  console.log("MatchingEngine:", matching.address);

  console.log(
    "\n프론트 .env 예:\nVITE_MATCHING_ENGINE_ADDRESS=" +
      matching.address +
      "\nVITE_ZKP_BADGE_ADDRESS=" +
      zkpBadge.address,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});