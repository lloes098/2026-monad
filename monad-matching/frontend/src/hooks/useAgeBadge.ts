import { useCallback, useMemo } from "react";
import { groth16 } from "snarkjs";
import { useAccount, usePublicClient, useWalletClient, useReadContract } from "wagmi";
import type { Address } from "viem";

import { adultBadgeAbi, ageRangeBadgeAbi } from "../abis/ageBadge";
import { getAdultBadgeAddress, getAgeRangeBadgeAddress } from "../lib/contracts";
import { parseGroth16SolidityCalldata } from "../lib/parseGroth16Calldata";

const base = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const AGE_CHECK_WASM = `${base}zkp/age_check.wasm`;
const AGE_CHECK_ZKEY = `${base}zkp/age_check_final.zkey`;
const AGE_RANGE_WASM = `${base}zkp/age_range.wasm`;
const AGE_RANGE_ZKEY = `${base}zkp/age_range_final.zkey`;

/** 성인인증 ZKP 훅 */
export function useAdultBadge() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const badgeAddress = getAdultBadgeAddress();

  const { data: isAdultVerified, refetch } = useReadContract({
    address: badgeAddress,
    abi: adultBadgeAbi,
    functionName: "isAdultVerified",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(badgeAddress && address) },
  });

  const { data: currentYear } = useReadContract({
    address: badgeAddress,
    abi: adultBadgeAbi,
    functionName: "currentYear",
    query: { enabled: Boolean(badgeAddress) },
  });

  const { data: currentMonth } = useReadContract({
    address: badgeAddress,
    abi: adultBadgeAbi,
    functionName: "currentMonth",
    query: { enabled: Boolean(badgeAddress) },
  });

  const ready = useMemo(
    () => Boolean(badgeAddress && address && publicClient && walletClient && currentYear && currentMonth),
    [badgeAddress, address, publicClient, walletClient, currentYear, currentMonth],
  );

  const claimAdultBadge = useCallback(
    async (birthYear: number, birthMonth: number) => {
      if (!ready || !address || !badgeAddress || !publicClient || !walletClient || !currentYear || !currentMonth) {
        throw new Error("지갑·컨트랙트를 확인해 주세요.");
      }

      const { proof, publicSignals } = await groth16.fullProve(
        {
          birthYear: birthYear.toString(),
          birthMonth: birthMonth.toString(),
          currentYear: currentYear.toString(),
          currentMonth: currentMonth.toString(),
        },
        AGE_CHECK_WASM,
        AGE_CHECK_ZKEY,
      );

      if (publicSignals[0] !== "1") {
        throw new Error("만 19세 이상만 인증할 수 있어요.");
      }

      const raw = await groth16.exportSolidityCallData(proof, publicSignals);
      const { a, b, c } = parseGroth16SolidityCalldata(raw);

      const pubSignals: [bigint, bigint, bigint] = [
        BigInt(publicSignals[0]),
        BigInt(publicSignals[1]),
        BigInt(publicSignals[2]),
      ];

      const hash = await walletClient.writeContract({
        address: badgeAddress,
        abi: adultBadgeAbi,
        functionName: "claimAdultBadge",
        args: [a, b, c, pubSignals],
        chain: walletClient.chain,
        account: address as Address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
      return hash;
    },
    [ready, address, badgeAddress, publicClient, walletClient, currentYear, currentMonth, refetch],
  );

  return { badgeAddress, isAdultVerified: isAdultVerified === true, ready, claimAdultBadge };
}

/** 나이대 ZKP 훅 */
export function useAgeRangeBadge() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const badgeAddress = getAgeRangeBadgeAddress();

  const { data: ageRangeCode, refetch } = useReadContract({
    address: badgeAddress,
    abi: ageRangeBadgeAbi,
    functionName: "ageRange",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(badgeAddress && address) },
  });

  const { data: currentYear } = useReadContract({
    address: badgeAddress,
    abi: ageRangeBadgeAbi,
    functionName: "currentYear",
    query: { enabled: Boolean(badgeAddress) },
  });

  const { data: currentMonth } = useReadContract({
    address: badgeAddress,
    abi: ageRangeBadgeAbi,
    functionName: "currentMonth",
    query: { enabled: Boolean(badgeAddress) },
  });

  const ready = useMemo(
    () => Boolean(badgeAddress && address && publicClient && walletClient && currentYear && currentMonth),
    [badgeAddress, address, publicClient, walletClient, currentYear, currentMonth],
  );

  const AGE_RANGE_LABELS: Record<number, string> = {
    1: "10대", 2: "20대", 3: "30대", 4: "40대", 5: "50대 이상",
  };

  const claimAgeRangeBadge = useCallback(
    async (birthYear: number, birthMonth: number, rangeMin: number, rangeMax: number) => {
      if (!ready || !address || !badgeAddress || !publicClient || !walletClient || !currentYear || !currentMonth) {
        throw new Error("지갑·컨트랙트를 확인해 주세요.");
      }

      const { proof, publicSignals } = await groth16.fullProve(
        {
          birthYear: birthYear.toString(),
          birthMonth: birthMonth.toString(),
          currentYear: currentYear.toString(),
          currentMonth: currentMonth.toString(),
          ageRangeMin: rangeMin.toString(),
          ageRangeMax: rangeMax.toString(),
        },
        AGE_RANGE_WASM,
        AGE_RANGE_ZKEY,
      );

      if (publicSignals[0] !== "1") {
        throw new Error("해당 나이대에 속하지 않아요.");
      }

      const raw = await groth16.exportSolidityCallData(proof, publicSignals);
      const { a, b, c } = parseGroth16SolidityCalldata(raw);

      const pubSignals: [bigint, bigint, bigint, bigint, bigint] = [
        BigInt(publicSignals[0]),
        BigInt(publicSignals[1]),
        BigInt(publicSignals[2]),
        BigInt(publicSignals[3]),
        BigInt(publicSignals[4]),
      ];

      const hash = await walletClient.writeContract({
        address: badgeAddress,
        abi: ageRangeBadgeAbi,
        functionName: "claimAgeRangeBadge",
        args: [a, b, c, pubSignals],
        chain: walletClient.chain,
        account: address as Address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
      return hash;
    },
    [ready, address, badgeAddress, publicClient, walletClient, currentYear, currentMonth, refetch],
  );

  return {
    badgeAddress,
    ageRangeCode: Number(ageRangeCode ?? 0),
    ageRangeLabel: AGE_RANGE_LABELS[Number(ageRangeCode ?? 0)] ?? null,
    ready,
    claimAgeRangeBadge,
  };
}
