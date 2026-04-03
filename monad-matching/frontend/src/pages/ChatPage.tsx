import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { isAddress } from "viem";

import { MOCK_MATCHES } from "../data/mock";
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

  const { address } = useAccount();
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
      return;
    }
    const now = new Date();
    const at = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), fromMe: true, text: t, at },
    ]);
    setDraft("");
  }

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
        <button type="button" className="chat-compose__send" onClick={() => void send()}>
          보내기
        </button>
      </div>

      <div className="chat-v2-actions">
        <Link
          to={`/profile/peer/${validPeer}`}
          className="chat-v2-actions__secondary"
        >
          프로필 보기
        </Link>
        <button type="button" className="chat-v2-actions__primary" disabled>
          데이트 종료
        </button>
      </div>
    </div>
  );
}
