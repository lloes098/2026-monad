import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        type="button"
        className="topbar__btn topbar__btn--connected"
        onClick={() => disconnect()}
        title="연결 해제"
      >
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="topbar__btn"
      disabled={isPending}
      onClick={() => {
        const ready = connectors.filter((c) => c.ready);
        const connector = ready[0] ?? connectors[0];
        if (connector) connect({ connector });
      }}
    >
      {isPending ? "연결 중…" : "연결"}
    </button>
  );
}
