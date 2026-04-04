import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect({
    network: "monadTestnet",
  });

  const matchingEngine = await viem.deployContract("MatchingEngine");

  console.log("MatchingEngine deployed at:", matchingEngine.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
