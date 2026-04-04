import { useReadContracts } from "wagmi";
import type { Address } from "viem";

import { zkpBadgeAbi } from "../abis/zkpBadge";
import { adultBadgeAbi, ageRangeBadgeAbi } from "../abis/ageBadge";
import {
  getZKPBadgeAddress,
  getAdultBadgeAddress,
  getAgeRangeBadgeAddress,
} from "../lib/contracts";

const AGE_RANGE_LABELS: Record<number, string> = {
  1: "10대", 2: "20대", 3: "30대", 4: "40대", 5: "50대+",
};

export type UserBadges = {
  hasBalanceBadge: boolean;
  isAdultVerified: boolean;
  ageRangeLabel: string | null;
};

export function useUserBadges(address: Address | undefined): UserBadges {
  const zkpAddress = getZKPBadgeAddress();
  const adultAddress = getAdultBadgeAddress();
  const ageRangeAddress = getAgeRangeBadgeAddress();

  const enabled = Boolean(address);

  const { data } = useReadContracts({
    contracts: [
      {
        address: zkpAddress,
        abi: zkpBadgeAbi,
        functionName: "hasBadge",
        args: address ? [address] : undefined,
      },
      {
        address: adultAddress,
        abi: adultBadgeAbi,
        functionName: "isAdultVerified",
        args: address ? [address] : undefined,
      },
      {
        address: ageRangeAddress,
        abi: ageRangeBadgeAbi,
        functionName: "ageRange",
        args: address ? [address] : undefined,
      },
    ],
    query: { enabled },
  });

  const hasBalanceBadge = data?.[0]?.result === true;
  const isAdultVerified = data?.[1]?.result === true;
  const ageRangeCode = Number(data?.[2]?.result ?? 0);

  return {
    hasBalanceBadge,
    isAdultVerified,
    ageRangeLabel: AGE_RANGE_LABELS[ageRangeCode] ?? null,
  };
}
