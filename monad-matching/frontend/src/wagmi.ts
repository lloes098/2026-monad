import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { localhost, sepolia } from "wagmi/chains";

const monadRpc =
  typeof import.meta.env.VITE_MONAD_RPC_URL === "string" &&
  import.meta.env.VITE_MONAD_RPC_URL.length > 0
    ? import.meta.env.VITE_MONAD_RPC_URL
    : "https://testnet-rpc.monad.xyz";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [monadRpc] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet-explorer.monad.xyz",
    },
  },
});

/** 로컬 Hardhat 우선 — 첫 체인이 기본 조회에 쓰이므로 localhost를 앞에 두면 혼선이 줄어듦 */
export const wagmiConfig = createConfig({
  chains: [localhost, monadTestnet, sepolia],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(monadRpc),
    [sepolia.id]: http(),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
});
