import { useCallback, useMemo } from "react";
import { groth16 } from "snarkjs";
import {
  useAccount,
  useReadContract,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import type { Address } from "viem";

import { zkpBadgeAbi } from "../abis/zkpBadge";
import { getZKPBadgeAddress } from "../lib/contracts";
import { parseGroth16SolidityCalldata } from "../lib/parseGroth16Calldata";
import { ZKP_THRESHOLD_WEI, ZKP_WASM_URL, ZKP_ZKEY_URL } from "../lib/zkpConstants";

export function useZKPBadge() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const badgeAddress = getZKPBadgeAddress();

  const readEnabled = Boolean(badgeAddress && address);

  const { data: hasBadge, refetch: refetchHasBadge } = useReadContract({
    address: badgeAddress,
    abi: zkpBadgeAbi,
    functionName: "hasBadge",
    args: address ? [address] : undefined,
    query: { enabled: readEnabled },
  });

  const ready = useMemo(
    () =>
      Boolean(
        badgeAddress &&
          address &&
          publicClient &&
          walletClient &&
          chainId,
      ),
    [badgeAddress, address, publicClient, walletClient, chainId],
  );

  const claimBadge = useCallback(async () => {
    if (!ready || !address || !badgeAddress || !publicClient || !walletClient) {
      throw new Error("지갑·네트워크·VITE_ZKP_BADGE_ADDRESS 를 확인해 주세요.");
    }

    const balance = await publicClient.getBalance({ address });
    if (balance < ZKP_THRESHOLD_WEI) {
      throw new Error(
        `잔액이 기준(${ZKP_THRESHOLD_WEI.toString()} wei) 미만이면 증명을 만들 수 없어요.`,
      );
    }

    let proof: unknown;
    let publicSignals: string[];
    try {
      const out = await groth16.fullProve(
        {
          balance: balance.toString(),
          threshold: ZKP_THRESHOLD_WEI.toString(),
        },
        ZKP_WASM_URL,
        ZKP_ZKEY_URL,
      );
      proof = out.proof;
      publicSignals = out.publicSignals;
    } catch (e) {
      console.error("[zkp] fullProve", e);
      throw new Error(
        "증명 생성에 실패했어요. `npm run zkp:build` 로 wasm/zkey 를 public/zkp 에 두었는지 확인해 주세요.",
      );
    }

    const pubVals = publicSignals.map((s) => BigInt(s));
    const hasThreshold = pubVals.some((v) => v === ZKP_THRESHOLD_WEI);
    if (!hasThreshold) {
      throw new Error("공개 입력(threshold)이 컨트랙트와 일치하지 않아요.");
    }
    if (publicSignals.length < 2) {
      throw new Error(
        "회로 공개 신호가 2개여야 해요. `npm run zkp:build` 로 wasm/zkey 를 다시 만들었는지 확인해 주세요.",
      );
    }

    const rawCalldata = await groth16.exportSolidityCallData(proof, publicSignals);
    const { a, b, c } = parseGroth16SolidityCalldata(rawCalldata);

    const pubSignalsArg: readonly [bigint, bigint] = [
      BigInt(publicSignals[0]),
      BigInt(publicSignals[1]),
    ];

    const hash = await walletClient.writeContract({
      address: badgeAddress,
      abi: zkpBadgeAbi,
      functionName: "claimBadge",
      args: [a, b, c, pubSignalsArg],
      chain: walletClient.chain,
      account: address as Address,
    });

    await publicClient.waitForTransactionReceipt({ hash });
    await refetchHasBadge();
    return hash;
  }, [
    ready,
    address,
    badgeAddress,
    publicClient,
    walletClient,
    refetchHasBadge,
  ]);

  return {
    badgeAddress,
    hasBadge: hasBadge === true,
    claimBadge,
    ready,
  };
}
