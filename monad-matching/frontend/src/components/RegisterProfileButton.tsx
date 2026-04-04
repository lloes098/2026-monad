import { useCallback, useEffect, useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

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
      const hash = await writeContractAsync({
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
        <button
          type="button"
          className="topbar__btn topbar__btn--secondary"
          disabled={busy}
          title={errHint}
          onClick={() => void onRegister()}
        >
          {busy ? "등록 중…" : "온체인 등록"}
        </button>
      )}
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </>
  );
}
