import { Link } from "react-router-dom";

import { MOCK_MATCHES } from "../data/mock";

export function MatchesPage() {
  const demo = MOCK_MATCHES[0];

  return (
    <div className="page">
      <div className="page__hero">
        <h1 className="page__h">매칭</h1>
        <p className="page__lede">
          48시간 내 첫 메시지가 없으면 양쪽 평판이 감소해요.
        </p>
      </div>

      <ul className="match-list">
        <li className="match-card">
          <div className="match-card__row">
            <div>
              <p className="match-card__name">{demo.peerName}</p>
              <p className="match-card__addr">{demo.peerAddress}</p>
            </div>
            <span className="pill pill--accent">첫 메시지 완료</span>
          </div>
          <div className="match-card__meta">
            <span>매칭 {demo.matchedAtLabel}</span>
            <span>서로 좋아요 · 채팅 가능</span>
          </div>
          <div className="timer">
            <div className="timer__labels">
              <span>48시간 윈도우</span>
              <span>{demo.timeLeftPercent}% 남음</span>
            </div>
            <div className="timer__track">
              <div className="timer__fill" style={{ width: `${demo.timeLeftPercent}%` }} />
            </div>
          </div>
          <div className="match-card__actions">
            <Link className="btn btn--outline btn--full" to={`/chat/${demo.peerAddress}`}>
              채팅 열기
            </Link>
          </div>
        </li>
      </ul>
    </div>
  );
}
