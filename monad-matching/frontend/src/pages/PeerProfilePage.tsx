import { Link, Navigate, useParams } from "react-router-dom";
import { isAddress } from "viem";

import { MOCK_MATCHES, MOCK_PROFILES } from "../data/mock";
import { shortAddress } from "../lib/formatAddress";

export function PeerProfilePage() {
  const { peerAddress } = useParams<{ peerAddress: string }>();
  const normalized =
    peerAddress?.startsWith("0x") ? (peerAddress as `0x${string}`) : undefined;

  if (!normalized || !isAddress(normalized)) {
    return <Navigate to="/chats" replace />;
  }

  const key = normalized.toLowerCase();
  const profile = MOCK_PROFILES.find(
    (p) => p.targetAddress.toLowerCase() === key,
  );
  const match = MOCK_MATCHES.find(
    (m) => m.peerAddress.toLowerCase() === key,
  );

  const displayName = profile?.name ?? match?.peerName ?? shortAddress(normalized);
  const tagline = profile?.tagline ?? "목 데이터에 태그라인이 없어요.";

  return (
    <div className="page">
      <div className="page__hero">
        <Link to={`/chat/${normalized}`} className="back-link">
          ← 대화
        </Link>
        <h1 className="page__h">프로필</h1>
        <p className="page__lede">대화 중인 상대의 공개 정보예요.</p>
      </div>

      {profile ? (
        <div
          className="peer-profile-photo"
          style={{ background: profile.gradient }}
        >
          <img
            className="peer-profile-photo__img"
            src={profile.photoUrl}
            alt=""
          />
        </div>
      ) : null}

      <div className="hero-card">
        <div className="hero-card__avatar" aria-hidden>
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="hero-card__head">
          <p className="hero-card__name">{displayName}</p>
          <p className="hero-card__addr" title={normalized}>
            {normalized}
          </p>
          <div className="hero-card__badges">
            <span className="badge badge--muted">상대 프로필 (목업)</span>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__title">한 줄 소개</h2>
        <p className="panel__bio">{tagline}</p>
      </section>

      <div className="profile-actions">
        <Link
          to={`/chat/${normalized}`}
          className="btn btn--primary btn--full"
        >
          대화로 돌아가기
        </Link>
        <Link to="/chats" className="btn btn--outline btn--full">
          채팅 목록
        </Link>
      </div>
    </div>
  );
}
