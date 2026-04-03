import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

import { MOCK_ME } from "../data/mock";
import { shortAddress } from "../lib/formatAddress";
import { loadLocalProfile } from "../lib/localProfile";
import { useMyRegistration } from "../hooks/useMatchingEngine";

export function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isRegistered, isLoadingRegistration } = useMyRegistration();
  const local = loadLocalProfile();

  const displayName =
    local.nickname.trim() ||
    (isConnected && address ? "내 프로필" : MOCK_ME.displayName);

  const addressLine =
    isConnected && address ? shortAddress(address) : null;

  return (
    <div className="page">
      <div className="page__hero">
        <h1 className="page__h">프로필</h1>
        <p className="page__lede">
          오프체인 프로필은 편집 화면에서, 온체인 등록·평판은 컨트랙트에서 다뤄요.
        </p>
      </div>

      <div className="hero-card">
        <div className="hero-card__avatar" aria-hidden>
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="hero-card__head">
          <p className="hero-card__name">{displayName}</p>
          <p
            className="hero-card__addr"
            title={isConnected && address ? address : undefined}
          >
            {addressLine ?? "지갑을 연결하면 주소가 표시돼요."}
          </p>
          <div className="hero-card__badges">
            <span
              className={`badge ${isRegistered ? "badge--ok" : "badge--muted"}`}
            >
              {isLoadingRegistration
                ? "확인 중…"
                : isRegistered
                  ? "온체인 등록됨"
                  : "온체인 미등록"}
            </span>
            <span className="badge badge--muted">성인·학교 인증 (예정)</span>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <Link to="/profile/edit" className="btn btn--primary btn--full">
          프로필 편집
        </Link>
        <Link to="/welcome" className="btn btn--outline btn--full">
          지갑 연결 안내
        </Link>
      </div>

      {local.bio ? (
        <section className="panel">
          <h2 className="panel__title">소개</h2>
          <p className="panel__bio">{local.bio}</p>
        </section>
      ) : null}

      {(local.school || local.job || local.interests || local.region) && (
        <section className="panel panel--tight">
          <h2 className="panel__title">상세</h2>
          <dl className="kv">
            {local.school ? (
              <div className="kv__row">
                <dt>학교</dt>
                <dd>{local.school}</dd>
              </div>
            ) : null}
            {local.job ? (
              <div className="kv__row">
                <dt>직장</dt>
                <dd>{local.job}</dd>
              </div>
            ) : null}
            {local.interests ? (
              <div className="kv__row">
                <dt>관심사</dt>
                <dd>{local.interests}</dd>
              </div>
            ) : null}
            {local.region ? (
              <div className="kv__row">
                <dt>지역</dt>
                <dd>{local.region}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      )}

      <section className="panel">
        <h2 className="panel__title">평판 (목업)</h2>
        <p className="panel__stat">
          <span className="panel__num">{MOCK_ME.reputation}</span>
          <span className="panel__unit">점</span>
        </p>
        <p className="panel__hint">
          다음 단계에서 <code>reputationScore</code> 를 읽어 표시할 수 있어요.
        </p>
      </section>

      <section className="panel panel--tight">
        <h2 className="panel__title">컨트랙트</h2>
        <dl className="kv">
          <div className="kv__row">
            <dt>MATCH_EXPIRY</dt>
            <dd>{MOCK_ME.matchExpiryHours}h</dd>
          </div>
          <div className="kv__row">
            <dt>GHOSTING_PENALTY</dt>
            <dd>1</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
