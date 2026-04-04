import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, type Address } from "viem";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { getMatchingEngineAddress } from "../lib/contracts";
import { shortAddress } from "../lib/formatAddress";

/** MatchingEngine 배포 블록 (Monad Testnet) */
const DEPLOY_FROM_BLOCK = 23_189_000n;
const CHUNK_SIZE = 100n;

export type OnChainMatch = {
  peerAddress: Address;
  peerName: string;
  matchedAt: number;
  matchedAtLabel: string;
  timeLeftPercent: number;
  iSentFirst: boolean;
  peerSentFirst: boolean;
  expired: boolean;
  status: "active" | "messaged" | "expired";
};

function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts * 1000;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${Math.floor(diffHours / 24)}일 전`;
}

const MATCH_EXPIRY_SEC = 48 * 3600;

export function useMyMatches() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = getMatchingEngineAddress();

  const [matches, setMatches] = useState<OnChainMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!address || !contractAddress || !publicClient) return;
    setLoading(true);
    setError(null);

    try {
      const matchedEvent = parseAbiItem(
        "event Matched(address indexed user1, address indexed user2, uint256 timestamp)",
      );

      const latestBlock = await publicClient.getBlockNumber();

      const fetchChunked = async (args: { user1?: Address; user2?: Address }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const all: any[] = [];
        let start = DEPLOY_FROM_BLOCK;
        while (start <= latestBlock) {
          const end = start + CHUNK_SIZE - 1n < latestBlock ? start + CHUNK_SIZE - 1n : latestBlock;
          const logs = await publicClient.getLogs({
            address: contractAddress,
            event: matchedEvent,
            args,
            fromBlock: start,
            toBlock: end,
          });
          all.push(...logs);
          start = end + 1n;
        }
        return all;
      };

      const [logsAs1, logsAs2] = await Promise.all([
        fetchChunked({ user1: address }),
        fetchChunked({ user2: address }),
      ]);

      // peer address → {checksummed address, matchedAt}
      const peerMap = new Map<string, { addr: Address; matchedAt: bigint }>();
      for (const log of logsAs1) {
        if (log.args.user2) {
          peerMap.set(log.args.user2.toLowerCase(), {
            addr: log.args.user2,
            matchedAt: (log.args.timestamp as bigint | undefined) ?? 0n,
          });
        }
      }
      for (const log of logsAs2) {
        if (log.args.user1) {
          peerMap.set(log.args.user1.toLowerCase(), {
            addr: log.args.user1,
            matchedAt: (log.args.timestamp as bigint | undefined) ?? 0n,
          });
        }
      }

      if (peerMap.size === 0) {
        setMatches([]);
        return;
      }

      const results = await Promise.all(
        Array.from(peerMap.values()).map(async ({ addr: peer, matchedAt: matchedAtBig }) => {
          const matchedAt = Number(matchedAtBig);
          const nowSec = Math.floor(Date.now() / 1000);
          const elapsedSec = nowSec - matchedAt;
          const remainingSec = Math.max(0, MATCH_EXPIRY_SEC - elapsedSec);
          const timeLeftPercent = Math.round((remainingSec / MATCH_EXPIRY_SEC) * 100);

          const [isExpiredVal, iSentFirst, peerSentFirst] = await Promise.all([
            publicClient.readContract({
              address: contractAddress,
              abi: matchingEngineAbi,
              functionName: "isExpired",
              args: [address, peer],
            }),
            publicClient.readContract({
              address: contractAddress,
              abi: matchingEngineAbi,
              functionName: "hasFirstMessage",
              args: [address, peer],
            }),
            publicClient.readContract({
              address: contractAddress,
              abi: matchingEngineAbi,
              functionName: "hasFirstMessage",
              args: [peer, address],
            }),
          ]);

          const status: OnChainMatch["status"] = isExpiredVal
            ? "expired"
            : iSentFirst || peerSentFirst
              ? "messaged"
              : "active";

          return {
            peerAddress: peer,
            peerName: shortAddress(peer),
            matchedAt,
            matchedAtLabel: formatTimeAgo(matchedAt),
            timeLeftPercent,
            iSentFirst,
            peerSentFirst,
            expired: isExpiredVal,
            status,
          } satisfies OnChainMatch;
        }),
      );

      setMatches(results.sort((a, b) => b.matchedAt - a.matchedAt));
    } catch (e) {
      setError(e instanceof Error ? e.message : "매칭 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [address, contractAddress, publicClient]);

  useEffect(() => {
    if (isConnected && address && contractAddress) void fetchMatches();
  }, [isConnected, address, contractAddress, fetchMatches]);

  return { matches, loading, error, refetch: fetchMatches };
}
