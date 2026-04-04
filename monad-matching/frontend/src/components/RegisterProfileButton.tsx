import { useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { useMyRegistration } from "../hooks/useMatchingEngine";

export function RegisterProfileButton() {
  const { isConnected, chainId } = useAccount();
  const { contractAddress, isRegistered, refetchRegistration } = useMyRegistration();
  const [withDeposit, setWithDeposit] = useState(false);

  const { data: hash, writeContract, isPending, error: writeError, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, isError: isReceiptError } = useWaitForTransactionReceipt({
    hash,
    chainId: chainId ?? undefined,
    query: { enabled: Boolean(hash && chainId) },
  });

  useEffect(() => {
    if (isSuccess) void refetchRegistration();
  }, [isSuccess, refetchRegistration]);

  useEffect(() => {
    if (isReceiptError) reset();
  }, [isReceiptError, reset]);

  if (!isConnected || !contractAddress || isRegistered) return null;

  const busy = isPending || (Boolean(hash && chainId) && isConfirming);
  const errHint = writeError instanceof Error ? writeError.message : undefined;

  const handleRegister = () => {
    if (withDeposit) {
      writeContract({
        address: contractAddress,
        abi: matchingEngineAbi,
        functionName: "registerWithDeposit",
        value: parseEther("0.01"),
      });
    } else {
      writeContract({
        address: contractAddress,
        abi: matchingEngineAbi,
        functionName: "registerProfile",
      });
    }
  };

  return (
    <div className="topbar__register-wrap">
      <button
        type="button"
        className="topbar__btn topbar__btn--secondary"
        disabled={busy}
        title={errHint}
        onClick={handleRegister}
      >
        {busy ? "등록 중…" : withDeposit ? "예치 등록 (0.01 MON)" : "온체인 등록"}
      </button>
      <button
        type="button"
        className="topbar__btn topbar__btn--ghost"
        disabled={busy}
        title={withDeposit ? "예치금 없이 등록" : "0.01 MON 예치 후 등록 (고스팅 시 환급)"}
        onClick={() => setWithDeposit((v) => !v)}
      >
        {withDeposit ? "일반" : "예치"}
      </button>
    </div>
  );
}
