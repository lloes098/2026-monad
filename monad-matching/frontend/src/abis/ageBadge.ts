import { parseAbi } from "viem";

export const adultBadgeAbi = parseAbi([
  "function isAdultVerified(address) view returns (bool)",
  "function currentYear() view returns (uint256)",
  "function currentMonth() view returns (uint256)",
  "function claimAdultBadge(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[3] pubSignals)",
  "event AdultVerified(address indexed user)",
]);

export const ageRangeBadgeAbi = parseAbi([
  "function ageRange(address) view returns (uint8)",
  "function currentYear() view returns (uint256)",
  "function currentMonth() view returns (uint256)",
  "function claimAgeRangeBadge(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[5] pubSignals)",
  "event AgeRangeVerified(address indexed user, uint8 rangeCode)",
]);
