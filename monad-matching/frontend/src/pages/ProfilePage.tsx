import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

import { useMyRegistration, useMyReputation } from "../hooks/useMatchingEngine";
import { useZKPBadge } from "../hooks/useZKPBadge";
import { useAdultBadge, useAgeRangeBadge } from "../hooks/useAgeBadge";
import { shortAddress } from "../lib/formatAddress";
import { loadLocalProfile } from "../lib/localProfile";

const AGE_RANGES = [
  { label: "10대", min: 10, max: 19 },
  { label: "20대", min: 20, max: 29 },
  { label: "30대", min: 30, max: 39 },
  { label: "40대", min: 40, max: 49 },
  { label: "50대+", min: 50, max: 99 },
];

function BirthInput({ onSubmit, busy, label }: {
  onSubmit: (year: number, month: number) => void;
  busy: boolean;
  label: string;
}) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  return (
    <div className="birth-input">
      <input
        type="number"
        placeholder="출생연도 (예: 1995)"
        value={year}
        min={1900}
        max={2010}
        onChange={(e) => setYear(e.target.value)}
        className="birth-input__field"
        disabled={busy}
      />
      <input
        type="number"
        placeholder="월 (1~12)"
        value={month}
        min={1}
        max={12}
        onChange={(e) => setMonth(e.target.value)}
        className="birth-input__field birth-input__field--sm"
        disabled={busy}
      />
      <button
        type="button"
        className="btn btn--outline"
        disabled={busy || !year || !month}
        onClick={() => onSubmit(Number(year), Number(month))}
      >
        {busy ? "증명 생성 중…" : label}
      </button>
    </div>
  );
}

export function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isRegistered, isLoadingRegistration } = useMyRegistration();
  const { score: reputationScore, isLoading: isReputationLoading } = useMyReputation();
  const { badgeAddress, hasBadge, claimBadge, ready: zkpReady } = useZKPBadge();
  const { isAdultVerified, ready: adultReady, claimAdultBadge } = useAdultBadge();
  const { ageRangeCode, ageRangeLabel, ready: ageReady, claimAgeRangeBadge } = useAgeRangeBadge();

  const [zkpBusy, setZkpBusy] = useState(false);
  const [adultBusy, setAdultBusy] = useState(false);
  const [ageBusy, setAgeBusy] = useState(false);
  const [showAdultInput, setShowAdultInput] = useState(false);
  const [showAgeInput, setShowAgeInput] = useState(false);
  const [selectedRange, setSelectedRange] = useState(AGE_RANGES[1]);
  const [err, setErr] = useState<string | null>(null);

  const local = loadLocalProfile();
  const displayName = local.nickname.trim() || (isConnected && address ? "내 프로필" : "프로필");
  const addressLine = isConnected && address ? shortAddress(address) : null;

  const handleErr = (e: unknown) => setErr(e instanceof Error ? e.message : "요청에 실패했어요.");

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
          <p className="hero-card__addr" title={isConnected && address ? address : undefined}>
            {addressLine ?? "지갑을 연결하면 주소가 표시돼요."}
          </p>
          <div className="hero-card__badges">
            <span className={`badge ${isRegistered ? "badge--ok" : "badge--muted"}`}>
              {isLoadingRegistration ? "확인 중…" : isRegistered ? "온체인 등록됨" : "온체인 미등록"}
            </span>
            <span className={`badge ${hasBadge ? "badge--ok" : "badge--muted"}`}>
              {hasBadge ? "잔액 배지" : "잔액 미인증"}
            </span>
            <span className={`badge ${isAdultVerified ? "badge--ok" : "badge--muted"}`}>
              {isAdultVerified ? "성인 인증됨" : "성인 미인증"}
            </span>
            <span className={`badge ${ageRangeCode > 0 ? "badge--ok" : "badge--muted"}`}>
              {ageRangeCode > 0 ? ageRangeLabel ?? "나이대 인증됨" : "나이대 미인증"}
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
            {/* ── 잔액 ZKP ── */}
            {badgeAddress ? (
              <button
                type="button"
                className="btn btn--outline btn--full"
                disabled={!zkpReady || hasBadge || zkpBusy}
                title={
                  hasBadge
                    ? "이미 배지를 받았어요."
                    : !zkpReady
                      ? "네트워크·컨트랙트를 확인해 주세요."
                      : undefined
                }
                onClick={() => {
                  setErr(null);
                  setZkpBusy(true);
                  void claimBadge().catch(handleErr).finally(() => setZkpBusy(false));
                }}
              >
                {zkpBusy ? "증명·트랜잭션 처리 중…" : hasBadge ? "잔액 배지 보유 중" : "자산 인증 배지 받기 (ZKP)"}
              </button>
            ) : (
              <p className="panel__hint">
                버튼을 쓰려면{" "}
                <code className="panel__hint">VITE_ZKP_BADGE_ADDRESS</code> 에
                ZKPBadge 배포 주소를 넣고 개발 서버를 다시 띄워 주세요. (
                <code className="panel__hint">npx hardhat run scripts/deploy.ts</code>{" "}
                출력 참고)
              </p>
            )}

            {/* ── 성인인증 ZKP ── */}
            {adultReady && !isAdultVerified && (
              <>
                <button
                  type="button"
                  className="btn btn--outline btn--full"
                  disabled={adultBusy}
                  onClick={() => { setErr(null); setShowAdultInput((v) => !v); }}
                >
                  성인 인증 받기 (ZKP)
                </button>
                {showAdultInput && (
                  <BirthInput
                    label="성인 증명 제출"
                    busy={adultBusy}
                    onSubmit={(y, m) => {
                      setAdultBusy(true);
                      void claimAdultBadge(y, m)
                        .catch(handleErr)
                        .finally(() => { setAdultBusy(false); setShowAdultInput(false); });
                    }}
                  />
                )}
              </>
            )}
            {isAdultVerified && (
              <p className="panel__hint" style={{ textAlign: "center" }}>✓ 성인 인증 완료</p>
            )}

            {/* ── 나이대 ZKP ── */}
            {ageReady && ageRangeCode === 0 && (
              <>
                <button
                  type="button"
                  className="btn btn--outline btn--full"
                  disabled={ageBusy}
                  onClick={() => { setErr(null); setShowAgeInput((v) => !v); }}
                >
                  나이대 인증 받기 (ZKP)
                </button>
                {showAgeInput && (
                  <div className="age-range-form">
                    <div className="age-range-form__btns">
                      {AGE_RANGES.map((r) => (
                        <button
                          key={r.label}
                          type="button"
                          className={`btn btn--outline ${selectedRange.label === r.label ? "btn--selected" : ""}`}
                          onClick={() => setSelectedRange(r)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <BirthInput
                      label={`${selectedRange.label} 증명 제출`}
                      busy={ageBusy}
                      onSubmit={(y, m) => {
                        setAgeBusy(true);
                        void claimAgeRangeBadge(y, m, selectedRange.min, selectedRange.max)
                          .catch(handleErr)
                          .finally(() => { setAgeBusy(false); setShowAgeInput(false); });
                      }}
                    />
                  </div>
                )}
              </>
            )}
            {ageRangeCode > 0 && (
              <p className="panel__hint" style={{ textAlign: "center" }}>✓ 나이대 인증 완료 ({ageRangeLabel})</p>
            )}
          </>
        ) : (
          <p className="panel__hint">ZKP 배지는 지갑을 연결한 뒤 사용할 수 있어요.</p>
        )}

        <Link to="/welcome" className="btn btn--outline btn--full">
          지갑 연결 안내
        </Link>
      </div>

      {err && (
        <p className="banner banner--warn" role="alert">{err}</p>
      )}

      {local.bio && (
        <section className="panel">
          <h2 className="panel__title">소개</h2>
          <p className="panel__bio">{local.bio}</p>
        </section>
      )}

      {(local.school || local.job || local.interests || local.region) && (
        <section className="panel panel--tight">
          <h2 className="panel__title">상세</h2>
          <dl className="kv">
            {local.school && <div className="kv__row"><dt>학교</dt><dd>{local.school}</dd></div>}
            {local.job && <div className="kv__row"><dt>직장</dt><dd>{local.job}</dd></div>}
            {local.interests && <div className="kv__row"><dt>관심사</dt><dd>{local.interests}</dd></div>}
            {local.region && <div className="kv__row"><dt>지역</dt><dd>{local.region}</dd></div>}
          </dl>
        </section>
      )}

      <section className="panel">
        <h2 className="panel__title">평판</h2>
        <p className="panel__stat">
          <span className="panel__num">
            {isReputationLoading ? "…" : reputationScore !== null ? reputationScore : "—"}
          </span>
          <span className="panel__unit">점</span>
        </p>
        <p className="panel__hint">48시간 내 첫 메시지를 보내지 않으면 −1 패널티가 쌓여요.</p>
      </section>

      <section className="panel panel--tight">
        <h2 className="panel__title">컨트랙트</h2>
        <dl className="kv">
          <div className="kv__row"><dt>MATCH_EXPIRY</dt><dd>48h</dd></div>
          <div className="kv__row"><dt>GHOSTING_PENALTY</dt><dd>1</dd></div>
          <div className="kv__row"><dt>DEPOSIT</dt><dd>0.01 MON</dd></div>
        </dl>
      </section>
    </div>
  );
}
