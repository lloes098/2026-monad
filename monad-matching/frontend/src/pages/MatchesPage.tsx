import { MOCK_MATCHES } from "../data/mock";

function statusLabel(status: (typeof MOCK_MATCHES)[number]["status"]) {
  switch (status) {
    case "messaged":
      return "첫 메시지 완료";
    case "active":
      return "응답 대기";
    case "expired":
      return "만료";
    default:
      return "";
  }
}

export function MatchesPage() {
  return (
    <div className="page">
      <div className="page__hero">
        <h1 className="page__h">매칭</h1>
        <p className="page__lede">
          48시간 내 첫 메시지가 없으면 양쪽 평판이 감소해요.{" "}
          <code>expireMatch</code>
        </p>
      </div>

      <ul className="match-list">
        {MOCK_MATCHES.map((m) => (
          <li key={m.id} className="match-card">
            <div className="match-card__row">
              <div>
                <p className="match-card__name">{m.peerName}</p>
                <p className="match-card__addr">{m.peerAddress}</p>
              </div>
              <span
                className={`pill pill--${m.status === "expired" ? "muted" : "accent"}`}
              >
                {statusLabel(m.status)}
              </span>
            </div>

            <div className="match-card__meta">
              <span>매칭 {m.matchedAtLabel}</span>
              {!m.expired ? (
                <span>
                  첫 메시지 {m.firstMessageSent ? "기록됨" : "대기"}
                </span>
              ) : (
                <span>만료 처리됨</span>
              )}
            </div>

            {!m.expired ? (
              <div className="timer">
                <div className="timer__labels">
                  <span>48시간 윈도우</span>
                  <span>{m.timeLeftPercent}% 남음</span>
                </div>
                <div className="timer__track">
                  <div
                    className="timer__fill"
                    style={{ width: `${m.timeLeftPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="match-card__note">
                고스트 방지: 양쪽 평판 <strong>−1</strong>
              </p>
            )}

            {!m.expired && !m.firstMessageSent ? (
              <button type="button" className="btn btn--outline btn--full" disabled>
                첫 메시지 보냄 (연동 예정)
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
