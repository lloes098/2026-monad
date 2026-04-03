import { MOCK_ME } from "../data/mock";

export function ProfilePage() {
  return (
    <div className="page">
      <div className="page__hero">
        <h1 className="page__h">프로필</h1>
        <p className="page__lede">지갑과 평판은 컨트랙트에서 조회할 예정이에요.</p>
      </div>

      <div className="hero-card">
        <div className="hero-card__avatar" aria-hidden>
          {MOCK_ME.displayName.slice(0, 1)}
        </div>
        <div>
          <p className="hero-card__name">{MOCK_ME.displayName}</p>
          <p className="hero-card__addr">{MOCK_ME.address}</p>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__title">평판</h2>
        <p className="panel__stat">
          <span className="panel__num">{MOCK_ME.reputation}</span>
          <span className="panel__unit">점</span>
        </p>
        <p className="panel__hint">
          <code>reputationScore</code> — 매칭 만료 시 페널티가 적용돼요.
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
