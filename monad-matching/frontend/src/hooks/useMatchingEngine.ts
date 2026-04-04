import { useAccount, useReadContract } from "wagmi";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { getMatchingEngineAddress } from "../lib/contracts";

export function useMatchingEngineAddress() {
  return getMatchingEngineAddress();
}

export function useMyReputation() {
  const { address, isConnected } = useAccount();
  const contractAddress = getMatchingEngineAddress();

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "reputationScore",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address && contractAddress),
    },
  });

  return {
    score: data !== undefined ? Number(data) : null,
    isLoading,
  };
}

export function useMyRegistration() {
  const { address: user, isConnected } = useAccount();
  const contractAddress = getMatchingEngineAddress();

  const { data, isLoading, refetch, error } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "registered",
    args: user ? [user] : undefined,
    query: {
      enabled: Boolean(isConnected && user && contractAddress),
    },
  });

  return {
    contractAddress,
    userAddress: user,
    isRegistered: data === true,
    isLoadingRegistration: isLoading,
    refetchRegistration: refetch,
    registrationError: error,
  };
}
