import { useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { useMyRegistration } from "../hooks/useMatchingEngine";

export function RegisterProfileButton() {
  const { isConnected, chainId } = useAccount();
  const { contractAddress, isRegistered, refetchRegistration } =
    useMyRegistration();

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  /** MetaMask가 localhost(31337)인데 영수증만 Monad RPC로 조회하면 끝나지 않음 → 반드시 chainId 전달 */
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: chainId ?? undefined,
    query: {
      enabled: Boolean(hash && chainId),
    },
  });

  useEffect(() => {
    if (isSuccess) void refetchRegistration();
  }, [isSuccess, refetchRegistration]);

  useEffect(() => {
    if (isReceiptError) reset();
  }, [isReceiptError, reset]);

  if (!isConnected || !contractAddress || isRegistered) return null;

  const busy = isPending || (Boolean(hash && chainId) && isConfirming);
  const errHint =
    writeError instanceof Error ? writeError.message : undefined;

  return (
    <button
      type="button"
      className="topbar__btn topbar__btn--secondary"
      disabled={busy}
      title={errHint}
      onClick={() =>
        writeContract({
          address: contractAddress,
          abi: matchingEngineAbi,
          functionName: "registerProfile",
        })
      }
    >
      {busy ? "등록 중…" : "온체인 등록"}
    </button>
  );
}
