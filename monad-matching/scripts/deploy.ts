import { network } from "hardhat";

async function main() {
  console.log("Connecting to localhost...");

  const { viem } = await network.connect("localhost");

  console.log("Deploying MatchingEngine...");

  const contract = await viem.deployContract("MatchingEngine");

  console.log("Contract address:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});