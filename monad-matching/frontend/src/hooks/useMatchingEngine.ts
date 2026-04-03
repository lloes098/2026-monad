import { useAccount, useReadContract } from "wagmi";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { getMatchingEngineAddress } from "../lib/contracts";

export function useMatchingEngineAddress() {
  return getMatchingEngineAddress();
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
