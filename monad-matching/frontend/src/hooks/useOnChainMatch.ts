import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { getMatchingEngineAddress } from "../lib/contracts";

/** MatchingEngine.MATCH_EXPIRY 와 동일 (48 hours) */
export const MATCH_EXPIRY_SECONDS = 48n * 60n * 60n;

/**
 * 현재 사용자 ↔ peer 의 온체인 매칭 상태 (MatchingEngine).
 * hasFirstMessage(from, to) = from 이 to 에게 첫 메시지를 보냈는지.
 */
export function useOnChainMatch(peerAddress: Address | undefined) {
  const { address, isConnected } = useAccount();
  const contractAddress = getMatchingEngineAddress();

  /** 48시간 경과 여부를 화면에서 갱신하려면 주기적 리렌더가 필요함 */
  const [_wallClock, setWallClockTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setWallClockTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const baseEnabled = Boolean(
    isConnected && address && peerAddress && contractAddress,
  );

  const { data: matched, refetch: refetchMatched } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "isMatched",
    args:
      baseEnabled && address && peerAddress
        ? [address, peerAddress]
        : undefined,
    query: {
      enabled: baseEnabled,
      refetchInterval: baseEnabled ? 30_000 : false,
    },
  });

  const matchedOk = matched === true;

  const { data: matchTimestamp, refetch: refetchTs } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "getMatchTimestamp",
    args:
      baseEnabled && address && peerAddress
        ? [address, peerAddress]
        : undefined,
    query: { enabled: baseEnabled && matchedOk },
  });

  const { data: iSentFirst, refetch: refetchISent } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "hasFirstMessage",
    args:
      baseEnabled && address && peerAddress
        ? [address, peerAddress]
        : undefined,
    query: { enabled: baseEnabled && matchedOk },
  });

  const { data: peerSentFirst, refetch: refetchPeerSent } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "hasFirstMessage",
    args:
      baseEnabled && address && peerAddress
        ? [peerAddress, address]
        : undefined,
    query: { enabled: baseEnabled && matchedOk },
  });

  const { data: expired, refetch: refetchExpired } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "isExpired",
    args:
      baseEnabled && address && peerAddress
        ? [address, peerAddress]
        : undefined,
    query: { enabled: baseEnabled && matchedOk },
  });

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchMatched(),
      refetchTs(),
      refetchISent(),
      refetchPeerSent(),
      refetchExpired(),
    ]);
  }, [
    refetchMatched,
    refetchTs,
    refetchISent,
    refetchPeerSent,
    refetchExpired,
  ]);

  const chainViewsReady = useMemo(
    () =>
      matchedOk &&
      matchTimestamp !== undefined &&
      iSentFirst !== undefined &&
      peerSentFirst !== undefined &&
      expired !== undefined,
    [matchedOk, matchTimestamp, iSentFirst, peerSentFirst, expired],
  );

  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const expiryReached =
    matchTimestamp !== undefined
      ? nowSec >= BigInt(matchTimestamp) + MATCH_EXPIRY_SECONDS
      : false;

  const bothMessaged = Boolean(iSentFirst && peerSentFirst);

  const canExpireGhost =
    chainViewsReady &&
    expired === false &&
    !bothMessaged &&
    expiryReached;

  const shouldMarkAfterSend =
    chainViewsReady && expired === false && iSentFirst === false;

  return {
    contractAddress,
    matchedOnChain: matchedOk,
    expiredOnChain: expired === true,
    iSentFirstOnChain: iSentFirst === true,
    peerSentFirstOnChain: peerSentFirst === true,
    canExpireGhost,
    shouldMarkAfterSend,
    expiryReached,
    bothMessagedOnChain: bothMessaged,
    refetchOnChainMatch: refetchAll,
    chainViewsReady,
  };
}
