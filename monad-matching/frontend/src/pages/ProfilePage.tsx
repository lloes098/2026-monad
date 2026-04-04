import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

import { useMyRegistration, useMyReputation } from "../hooks/useMatchingEngine";
import { useZKPBadge } from "../hooks/useZKPBadge";
import { shortAddress } from "../lib/formatAddress";
import { loadLocalProfile } from "../lib/localProfile";

export function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isRegistered, isLoadingRegistration } = useMyRegistration();
  const { score: reputationScore, isLoading: isReputationLoading } = useMyReputation();
  const {
    badgeAddress,
    hasBadge,
    claimBadge,
    ready: zkpReady,
  } = useZKPBadge();
  const [zkpBusy, setZkpBusy] = useState(false);
  const [zkpErr, setZkpErr] = useState<string | null>(null);
  const local = loadLocalProfile();

  const displayName =
    local.nickname.trim() ||
    (isConnected && address ? "내 프로필" : "프로필");

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
            <span
              className={`badge ${hasBadge ? "badge--ok" : "badge--muted"}`}
            >
              {hasBadge ? "ZKP 잔액 배지" : "ZKP 배지 없음"}
            </span>
            <span className="badge badge--muted">
              소속·나이 ZKP 인증 (예정)
            </span>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <Link to="/profile/edit" className="btn btn--primary btn--full">
          프로필 편집
        </Link>
        {isConnected && address ? (
          <>
            <button
              type="button"
              className="btn btn--outline btn--full"
              disabled={
                !badgeAddress || !zkpReady || hasBadge || zkpBusy
              }
              title={
                hasBadge
                  ? "이미 배지를 받았어요."
                  : !badgeAddress
                    ? "frontend/.env에 VITE_ZKP_BADGE_ADDRESS(배포된 ZKPBadge 주소)를 넣어 주세요."
                    : !zkpReady
                      ? "네트워크·컨트랙트를 확인해 주세요."
                      : undefined
              }
              onClick={() => {
                if (!badgeAddress) return;
                setZkpErr(null);
                setZkpBusy(true);
                void claimBadge()
                  .catch((e: unknown) => {
                    setZkpErr(
                      e instanceof Error
                        ? e.message
                        : "ZKP 배지 요청에 실패했어요.",
                    );
                  })
                  .finally(() => setZkpBusy(false));
              }}
            >
              {zkpBusy
                ? "증명·트랜잭션 처리 중…"
                : hasBadge
                  ? "잔액 인증 배지 보유 중"
                  : "자산 인증 배지 받기 (ZKP)"}
            </button>
            {!badgeAddress ? (
              <p className="panel__hint">
                버튼을 쓰려면{" "}
                <code className="panel__hint">VITE_ZKP_BADGE_ADDRESS</code> 에
                ZKPBadge 배포 주소를 넣고 개발 서버를 다시 띄워 주세요. (
                <code className="panel__hint">npx hardhat run scripts/deploy.ts</code>{" "}
                출력 참고)
              </p>
            ) : null}
          </>
        ) : (
          <p className="panel__hint">
            ZKP 배지는 지갑을 연결한 뒤 사용할 수 있어요.
          </p>
        )}
        <Link to="/welcome" className="btn btn--outline btn--full">
          지갑 연결 안내
        </Link>
      </div>

      {zkpErr ? (
        <p className="banner banner--warn" role="alert">
          {zkpErr}
        </p>
      ) : null}

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
        <h2 className="panel__title">평판</h2>
        <p className="panel__stat">
          <span className="panel__num">
            {isReputationLoading
              ? "…"
              : reputationScore !== null
                ? reputationScore
                : "—"}
          </span>
          <span className="panel__unit">점</span>
        </p>
        <p className="panel__hint">
          48시간 내 첫 메시지를 보내지 않으면 −1 패널티가 쌓여요.
        </p>
      </section>

      <section className="panel panel--tight">
        <h2 className="panel__title">컨트랙트</h2>
        <dl className="kv">
          <div className="kv__row">
            <dt>MATCH_EXPIRY</dt>
            <dd>48h</dd>
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
