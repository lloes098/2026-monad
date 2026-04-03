import { parseAbi } from "viem";

/** MatchingEngine.sol — 프론트에 필요한 최소 ABI */
export const matchingEngineAbi = parseAbi([
  "function registerProfile()",
  "function registered(address) view returns (bool)",
  "function likeUser(address target)",
]);
