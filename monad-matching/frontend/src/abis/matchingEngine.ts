import { parseAbi } from "viem";

/** MatchingEngine.sol — 프론트용 ABI */
export const matchingEngineAbi = parseAbi([
  "function registerProfile()",
  "function registered(address) view returns (bool)",
  "function likeUser(address target)",
  "function markFirstMessageSent(address other)",
  "function expireMatch(address other)",
  "function reputationScore(address) view returns (int256)",
  "function isMatched(address user1, address user2) view returns (bool)",
  "function getMatchTimestamp(address user1, address user2) view returns (uint256)",
  "function hasFirstMessage(address user1, address user2) view returns (bool)",
  "function isExpired(address user1, address user2) view returns (bool)",
  "event Matched(address indexed user1, address indexed user2, uint256 timestamp)",
  "event FirstMessageMarked(address indexed from, address indexed to, uint256 timestamp)",
  "event MatchExpired(address indexed user1, address indexed user2, uint256 timestamp)",
]);
