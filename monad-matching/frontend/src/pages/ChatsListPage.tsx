import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { MOCK_MATCHES } from "../data/mock";
import {
  loadChatInboxThreads,
  type InboxThreadRow,
} from "../lib/loadChatInboxThreads";
import { getSupabase } from "../lib/supabaseClient";

type ChatFolder = "inbox" | "requests" | "archive";

type DisplayThread = {
  id: string;
  peerAddress: `0x${string}`;
  peerName: string;
  lastPreview: string;
  timeLabel: string;
  expired: boolean;
};

const TABS: { id: ChatFolder; label: string }[] = [
  { id: "inbox", label: "매칭 대화" },
  { id: "requests", label: "요청함" },
  { id: "archive", label: "보관함" },
];

function mockThreads(folder: ChatFolder): DisplayThread[] {
  if (folder === "requests") return [];
  const list =
    folder === "inbox"
      ? MOCK_MATCHES.filter((m) => !m.expired)
      : MOCK_MATCHES.filter((m) => m.expired);
  return list.map((m) => ({
    id: m.id,
    peerAddress: m.peerAddress,
    peerName: m.peerName,
    lastPreview: m.lastPreview ?? "대화를 시작해 보세요",
    timeLabel: m.matchedAtLabel,
    expired: m.expired,
  }));
}

function fromRemoteRows(rows: InboxThreadRow[]): DisplayThread[] {
  return rows.map((t) => ({
    id: t.threadKey,
    peerAddress: t.peerAddress,
    peerName: t.peerName,
    lastPreview: t.lastPreview,
    timeLabel: t.timeLabel,
    expired: false,
  }));
}

export function ChatsListPage() {
  const [folder, setFolder] = useState<ChatFolder>("inbox");
  const { address } = useAccount();
  const supabaseEnabled = Boolean(getSupabase());
  const useRemote = Boolean(supabaseEnabled && address);

  const [remoteThreads, setRemoteThreads] = useState<InboxThreadRow[]>([]);
  const [inboxLoadFailed, setInboxLoadFailed] = useState(false);

  const loadRemoteInbox = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !address) return;
    const { threads, error } = await loadChatInboxThreads(sb, address);
    setRemoteThreads(threads);
    setInboxLoadFailed(error !== null);
  }, [address]);

  useEffect(() => {
    if (!useRemote) {
      setRemoteThreads([]);
      setInboxLoadFailed(false);
      return;
    }
    void loadRemoteInbox();
    const t = window.setInterval(() => void loadRemoteInbox(), 12_000);
    return () => window.clearInterval(t);
  }, [useRemote, loadRemoteInbox]);

  const threads = useMemo((): DisplayThread[] => {
    if (folder === "requests") return [];
    if (useRemote) {
      if (folder === "inbox") return fromRemoteRows(remoteThreads);
      return [];
    }
    return mockThreads(folder);
  }, [folder, useRemote, remoteThreads]);

  const inboxCount = useRemote
    ? remoteThreads.length
    : MOCK_MATCHES.filter((m) => !m.expired).length;

  return (
    <div className="page page--chats-friends">
      <div className="page__hero">
        <h1 className="page__h">채팅</h1>
        <p className="page__lede">
          {folder === "inbox" ? (
            <>
              <span className="chats-friends-lede__count">{inboxCount}개</span>
            </>
          ) : folder === "archive" ? (
            <>
              <span className="chats-friends-lede__count">
                {threads.length}개
              </span>
              <span className="chats-friends-lede__hint">
                {" · 보관된 대화"}
              </span>
            </>
          ) : (
            <span className="chats-friends-lede__hint">
              받은 대화 요청이 여기에 표시돼요
            </span>
          )}
        </p>
      </div>

      {useRemote && inboxLoadFailed && folder === "inbox" ? (
        <p className="banner banner--warn" role="alert">
          대화 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      <div className="chats-friends-tabs" role="tablist" aria-label="대화 구분">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={folder === t.id}
            className={
              folder === t.id
                ? "chats-friends-tabs__btn chats-friends-tabs__btn--active"
                : "chats-friends-tabs__btn"
            }
            onClick={() => setFolder(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {folder === "requests" ? (
        <p className="chats-friends-empty">
          아직 요청이 없어요. 매칭을 받으면 여기에 표시돼요.
        </p>
      ) : threads.length === 0 ? (
        <p className="chats-friends-empty">
          {folder === "archive"
            ? "보관된 대화가 없어요."
            : "열린 대화가 없어요."}
        </p>
      ) : (
        <ul className="chats-friends-list">
          {threads.map((m) => (
            <li key={m.id}>
              <Link
                className={
                  m.expired
                    ? "chats-friends-row chats-friends-row--muted"
                    : "chats-friends-row"
                }
                to={`/chat/${m.peerAddress}`}
              >
                <span className="chats-friends-row__avatar" aria-hidden>
                  {m.peerName.slice(0, 1)}
                </span>
                <div className="chats-friends-row__body">
                  <span className="chats-friends-row__name">{m.peerName}</span>
                  <span className="chats-friends-row__preview">
                    {m.lastPreview}
                  </span>
                </div>
                <span className="chats-friends-row__time">{m.timeLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="chats-friends-footer">
        <Link to="/" className="chats-friends-cta">
          새 매칭 찾기
        </Link>
      </div>
    </div>
  );
}
