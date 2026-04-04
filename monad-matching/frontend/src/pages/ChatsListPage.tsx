import { Link } from "react-router-dom";
import { useState } from "react";

type ChatFolder = "inbox" | "requests" | "archive";

const TABS: { id: ChatFolder; label: string }[] = [
  { id: "inbox", label: "매칭 대화" },
  { id: "requests", label: "요청함" },
  { id: "archive", label: "보관함" },
];

type Thread = {
  id: string;
  peerAddress: `0x${string}`;
  peerName: string;
  preview: string;
  timeLabel: string;
};

const INBOX_THREADS: Thread[] = [
  {
    id: "t1",
    peerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    peerName: "Mina",
    preview: "내일 클라이밍 갈래?",
    timeLabel: "2시간 전",
  },
];

const REQUEST_THREADS: Thread[] = [
  {
    id: "r1",
    peerAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    peerName: "Jun",
    preview: "매칭됐어요 👋 먼저 인사드려요!",
    timeLabel: "어제",
  },
  {
    id: "r2",
    peerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    peerName: "Sora",
    preview: "안녕하세요, 디자인 얘기 나눠요 🎨",
    timeLabel: "3일 전",
  },
];

const ARCHIVE_THREADS: Thread[] = [
  {
    id: "a1",
    peerAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    peerName: "Hana",
    preview: "좋아요 보냈어요 ❤️",
    timeLabel: "1주 전",
  },
  {
    id: "a2",
    peerAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    peerName: "Leo",
    preview: "좋아요 보냈어요 ❤️",
    timeLabel: "2주 전",
  },
];

export function ChatsListPage() {
  const [folder, setFolder] = useState<ChatFolder>("inbox");

  const threads =
    folder === "inbox"
      ? INBOX_THREADS
      : folder === "requests"
        ? REQUEST_THREADS
        : ARCHIVE_THREADS;

  return (
    <div className="page page--chats-friends">
      <div className="page__hero">
        <h1 className="page__h">채팅</h1>
        <p className="page__lede">
          {folder === "inbox" ? (
            <span className="chats-friends-lede__count">{threads.length}개</span>
          ) : folder === "requests" ? (
            <span className="chats-friends-lede__hint">받은 대화 요청</span>
          ) : (
            <>
              <span className="chats-friends-lede__count">{threads.length}개</span>
              <span className="chats-friends-lede__hint">{" · 하트 보낸 상대"}</span>
            </>
          )}
        </p>
      </div>

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

      <ul className="chats-friends-list">
        {threads.map((m) => (
          <li key={m.id}>
            {folder === "archive" ? (
              <div className="chats-friends-row chats-friends-row--muted" style={{ cursor: "default" }}>
                <span className="chats-friends-row__avatar" aria-hidden>
                  {m.peerName.slice(0, 1)}
                </span>
                <div className="chats-friends-row__body">
                  <span className="chats-friends-row__name">{m.peerName}</span>
                  <span className="chats-friends-row__preview">{m.preview}</span>
                </div>
                <span className="chats-friends-row__time">{m.timeLabel}</span>
              </div>
            ) : (
              <Link className="chats-friends-row" to={`/chat/${m.peerAddress}`}>
                <span className="chats-friends-row__avatar" aria-hidden>
                  {m.peerName.slice(0, 1)}
                </span>
                <div className="chats-friends-row__body">
                  <span className="chats-friends-row__name">{m.peerName}</span>
                  <span className="chats-friends-row__preview">{m.preview}</span>
                </div>
                <span className="chats-friends-row__time">{m.timeLabel}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="chats-friends-footer">
        <Link to="/" className="chats-friends-cta">
          새 매칭 찾기
        </Link>
      </div>
    </div>
  );
}
