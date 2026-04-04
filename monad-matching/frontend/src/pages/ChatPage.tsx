import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { isAddress } from "viem";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { MOCK_MATCHES } from "../data/mock";
import { useOnChainMatch } from "../hooks/useOnChainMatch";
import { chatThreadKey } from "../lib/chatThreadKey";
import { shortAddress } from "../lib/formatAddress";
import { getSupabase, hasSupabaseEnv } from "../lib/supabaseClient";

type Msg = { id: string; fromMe: boolean; text: string; at: string };

/** 주소 키는 소문자로 통일 (URL 대소문자 무관) — 원격 채팅 미사용 시 시드 */
const seedMessages: Record<string, Msg[]> = {
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": [
    {
      id: "1",
      fromMe: false,
      text: "안녕하세요, 먼저 연락드려요. 같이 저녁 먹으면서 이야기 나누고 싶어요 😊",
      at: "14:02",
    },
    {
      id: "2",
      fromMe: true,
      text: "안녕하세요. 메시지 보내주셔서 감사합니다!",
      at: "14:05",
    },
  ],
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": [
    {
      id: "1",
      fromMe: false,
      text: "매칭됐네요 👋 먼저 인사드려요!",
      at: "09:41",
    },
    {
      id: "2",
      fromMe: true,
      text: "안녕하세요. 메시지 보내주셔서 감사합니다!",
      at: "09:43",
    },
  ],
};

export function ChatPage() {
  const { peerAddress } = useParams<{ peerAddress: string }>();
  const normalized = peerAddress?.startsWith("0x")
    ? (peerAddress as `0x${string}`)
    : undefined;
  const validPeer =
    normalized && isAddress(normalized) ? normalized : undefined;

  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();

  const {
    contractAddress,
    matchedOnChain,
    expiredOnChain,
    iSentFirstOnChain,
    canExpireGhost,
    expiryReached,
    bothMessagedOnChain,
    refetchOnChainMatch,
  } = useOnChainMatch(validPeer);

  const {
    data: chainTxHash,
    writeContractAsync,
    isPending: isChainWritePending,
    error: chainWriteError,
    reset: resetChainWrite,
  } = useWriteContract();

  const {
    isLoading: isChainConfirming,
    isSuccess: isChainConfirmed,
    isError: isChainReceiptError,
  } = useWaitForTransactionReceipt({
    hash: chainTxHash,
    chainId: chainId ?? undefined,
    query: {
      enabled: Boolean(chainTxHash && chainId),
    },
  });

  useEffect(() => {
    if (isChainConfirmed) void refetchOnChainMatch();
  }, [isChainConfirmed, refetchOnChainMatch]);

  useEffect(() => {
    if (isChainReceiptError) resetChainWrite();
  }, [isChainReceiptError, resetChainWrite]);

  const threadKey = useMemo(
    () => (address && validPeer ? chatThreadKey(address, validPeer) : null),
    [address, validPeer],
  );

  const match = useMemo(
    () =>
      validPeer
        ? MOCK_MATCHES.find(
            (m) => m.peerAddress.toLowerCase() === validPeer.toLowerCase(),
          )
        : undefined,
    [validPeer],
  );

  const supabaseEnabled = Boolean(getSupabase());
  const useRemote = Boolean(supabaseEnabled && address && threadKey);
  const envLooksConfigured = hasSupabaseEnv();

  const [draft, setDraft] = useState("");
  const [remoteError, setRemoteError] = useState<"load" | "send" | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    if (!peerAddress?.startsWith("0x")) return [];
    const n = peerAddress as `0x${string}`;
    if (!isAddress(n)) return [];
    const seed = seedMessages[n.toLowerCase()];
    return seed ? [...seed] : [];
  });

  const loadRemote = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !threadKey || !address) return;
    const { data, error } = await sb
      .from("chat_messages")
      .select("id, sender_address, body, created_at")
      .eq("thread_key", threadKey)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[chat] load messages", error);
      setRemoteError("load");
      return;
    }
    setRemoteError(null);
    const my = address.toLowerCase();
    setMsgs(
      (data ?? []).map((row: { id: string; sender_address: string; body: string; created_at: string }) => {
        const d = new Date(row.created_at);
        const at = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
        return {
          id: row.id,
          fromMe: row.sender_address.toLowerCase() === my,
          text: row.body,
          at,
        };
      }),
    );
  }, [threadKey, address]);

  useEffect(() => {
    if (!useRemote) return;
    void loadRemote();
  }, [useRemote, loadRemote]);

  useEffect(() => {
    if (!useRemote) return;
    const t = window.setInterval(() => void loadRemote(), 12_000);
    return () => window.clearInterval(t);
  }, [useRemote, loadRemote]);

  if (!validPeer) {
    return (
      <div className="page">
        <p className="empty-state">잘못된 주소예요.</p>
        <Link to="/chats">← 채팅 목록</Link>
      </div>
    );
  }

  async function maybeMarkFirstMessageOnChain() {
    if (!contractAddress || !address || !validPeer || !publicClient) return;
    await refetchOnChainMatch();
    try {
      const [onMatched, alreadySent, isEx] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: matchingEngineAbi,
          functionName: "isMatched",
          args: [address, validPeer],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: matchingEngineAbi,
          functionName: "hasFirstMessage",
          args: [address, validPeer],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: matchingEngineAbi,
          functionName: "isExpired",
          args: [address, validPeer],
        }),
      ]);
      if (!onMatched || isEx || alreadySent) return;
      await writeContractAsync({
        address: contractAddress,
        abi: matchingEngineAbi,
        functionName: "markFirstMessageSent",
        args: [validPeer],
      });
    } catch (e) {
      console.error("[chat] markFirstMessageSent", e);
    }
  }

  async function send() {
    const t = draft.trim();
    if (!t) return;
    const sb = getSupabase();
    if (sb && threadKey && address) {
      const { error } = await sb.from("chat_messages").insert({
        thread_key: threadKey,
        sender_address: address.toLowerCase(),
        body: t,
      });
      if (error) {
        console.error("[chat] send message", error);
        setRemoteError("send");
        return;
      }
      setRemoteError(null);
      setDraft("");
      await loadRemote();
      await maybeMarkFirstMessageOnChain();
      return;
    }
    const now = new Date();
    const at = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), fromMe: true, text: t, at },
    ]);
    setDraft("");
    await maybeMarkFirstMessageOnChain();
  }

  async function onExpireGhosting() {
    if (!contractAddress || !validPeer) return;
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: matchingEngineAbi,
        functionName: "expireMatch",
        args: [validPeer],
      });
    } catch (e) {
      console.error("[chat] expireMatch", e);
    }
  }

  const chainBusy =
    isChainWritePending || (Boolean(chainTxHash && chainId) && isChainConfirming);

  return (
    <div className="page page--chat">
      <header className="chat-v2-head">
        <div className="chat-v2-head__bar">
          <Link to="/chats" className="chat-v2-head__back" aria-label="뒤로">
            ←
          </Link>
          <span className="chat-v2-head__peer">
            {match?.peerName ?? shortAddress(validPeer)}
          </span>
        </div>
        <h1 className="chat-v2-head__title">주고받은 메시지</h1>
      </header>

      {envLooksConfigured && !supabaseEnabled ? (
        <p className="chat-supabase-hint chat-supabase-hint--warn">
          채팅 동기화를 시작하지 못했어요. 페이지를 새로고침하거나 잠시 후 다시
          시도해 주세요.
        </p>
      ) : null}

      {supabaseEnabled && !address ? (
        <p className="chat-supabase-hint">
          지갑을 연결하면 이 대화가 저장되고 다른 기기에서도 이어져요. 연결 전
          화면은 예시입니다.
        </p>
      ) : null}

      {remoteError === "load" ? (
        <p className="banner banner--warn chat-supabase-banner">
          메시지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
      {remoteError === "send" ? (
        <p className="banner banner--warn chat-supabase-banner">
          메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      {contractAddress && address ? (
        <p className="chat-supabase-hint" aria-live="polite">
          {!matchedOnChain
            ? "온체인에 이 상대와의 매칭이 없어요. 좋아요 매칭 후 첫 메시지를 온체인에 기록할 수 있어요."
            : expiredOnChain
              ? "이 매칭은 온체인에서 만료됐어요."
              : bothMessagedOnChain
                ? "양쪽 모두 첫 메시지를 보냈어요. 고스팅 만료는 적용되지 않아요."
                : iSentFirstOnChain
                  ? "내 첫 메시지는 온체인에 기록됐어요."
                  : "첫 메시지를 내면 온체인에 기록돼요."}
          {matchedOnChain &&
          !expiredOnChain &&
          !bothMessagedOnChain &&
          !expiryReached ? (
            <span> 48시간이 지나면 고스팅 처리를 온체인에 제출할 수 있어요.</span>
          ) : null}
        </p>
      ) : null}

      {chainWriteError instanceof Error ? (
        <p className="banner banner--warn chat-supabase-banner" role="alert">
          온체인 트랜잭션: {chainWriteError.message}
        </p>
      ) : null}

      <div className="chat-bubbles">
        {msgs.length === 0 ? (
          <p className="chat-bubbles__empty">첫 메시지를 보내 보세요.</p>
        ) : (
          msgs.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.fromMe ? "chat-bubble--me" : "chat-bubble--them"}`}
            >
              <p className="chat-bubble__text">{m.text}</p>
              <span className="chat-bubble__time">{m.at}</span>
            </div>
          ))
        )}
      </div>

      <div className="chat-compose">
        <input
          className="chat-compose__input"
          type="text"
          placeholder="메시지를 입력하세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void send())}
        />
        <button
          type="button"
          className="chat-compose__send"
          disabled={chainBusy}
          onClick={() => void send()}
        >
          {chainBusy ? "온체인 확인 중…" : "보내기"}
        </button>
      </div>

      <div className="chat-v2-actions">
        <Link
          to={`/profile/peer/${validPeer}`}
          className="chat-v2-actions__secondary"
        >
          프로필 보기
        </Link>
        <button
          type="button"
          className="chat-v2-actions__primary"
          disabled={!canExpireGhost || chainBusy}
          title={
            !contractAddress
              ? "VITE_MATCHING_ENGINE_ADDRESS 가 없어요."
              : !matchedOnChain
                ? "온체인 매칭이 없어요."
                : expiredOnChain
                  ? "이미 만료됐어요."
                  : bothMessagedOnChain
                    ? "양쪽이 모두 메시지를 보내 고스팅 만료를 쓸 수 없어요."
                    : !expiryReached
                      ? "48시간이 지나야 해요."
                      : "메시지 안 보낸 쪽만 평판이 깎여요."
          }
          onClick={() => void onExpireGhosting()}
        >
          {chainBusy ? "처리 중…" : "고스팅 만료 (온체인)"}
        </button>
      </div>
    </div>
  );
}
