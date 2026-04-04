import { useCallback, useEffect, useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseEther } from "viem";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { useMyRegistration } from "../hooks/useMatchingEngine";

export function RegisterProfileButton() {
  const { isConnected, chainId } = useAccount();
  const config = useConfig();
  const { contractAddress, isRegistered, refetchRegistration } =
    useMyRegistration();

  const {
    writeContractAsync,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const [withDeposit, setWithDeposit] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const onRegister = useCallback(async () => {
    if (!contractAddress || !chainId) return;
    try {
      setIsConfirming(true);
      const hash = withDeposit
        ? await writeContractAsync({
            address: contractAddress,
            abi: matchingEngineAbi,
            functionName: "registerWithDeposit",
            value: parseEther("0.01"),
          })
        : await writeContractAsync({
            address: contractAddress,
            abi: matchingEngineAbi,
            functionName: "registerProfile",
          });
      await waitForTransactionReceipt(config, { hash, chainId });
      await refetchRegistration();
      setToast("온체인 등록이 완료되었어요.");
    } catch {
      reset();
    } finally {
      setIsConfirming(false);
    }
  }, [
    contractAddress,
    chainId,
    config,
    writeContractAsync,
    refetchRegistration,
    reset,
    withDeposit,
  ]);

  if (!isConnected || !contractAddress) return null;

  const busy = isPending || isConfirming;
  const errHint =
    writeError instanceof Error ? writeError.message : undefined;

  return (
    <>
      {isRegistered ? (
        <button
          type="button"
          className="topbar__btn topbar__btn--secondary topbar__btn--registered"
          disabled
        >
          온체인 등록 완료
        </button>
      ) : (
        <div className="topbar__register-wrap">
          <button
            type="button"
            className="topbar__btn topbar__btn--secondary"
            disabled={busy}
            title={errHint}
            onClick={() => void onRegister()}
          >
            {busy
              ? "등록 중…"
              : withDeposit
                ? "예치 등록 (0.01 MON)"
                : "온체인 등록"}
          </button>
          <button
            type="button"
            className="topbar__btn topbar__btn--ghost"
            disabled={busy}
            title={
              withDeposit
                ? "예치금 없이 등록"
                : "0.01 MON 예치 후 등록 (고스팅 시 환급)"
            }
            onClick={() => setWithDeposit((v) => !v)}
          >
            {withDeposit ? "일반" : "예치"}
          </button>
        </div>
      )}
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </>
  );
}
