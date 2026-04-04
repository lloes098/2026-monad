import { parseAbi } from "viem";

export const zkpBadgeAbi = parseAbi([
  "function claimBadge(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c)",
  "function hasBadge(address) view returns (bool)",
  "function THRESHOLD() view returns (uint256)",
]);
