import { useState } from "react";

import { CATEGORY_ICONS } from "../components/CategoryIcons";
import { MOCK_CATEGORIES, MOCK_PROFILES } from "../data/mock";

export function DiscoverPage() {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  function like(id: string) {
    setLiked((prev) => ({ ...prev, [id]: true }));
    setToast("좋아요는 연동 후 MatchingEngine.likeUser 로 전송됩니다.");
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="page page--discover">
      <div className="page__hero">
        <h1 className="page__h">발견</h1>
        <p className="page__lede">
          상호 좋아요로 매칭되면 48시간 안에 첫 메시지 여부가 기록돼요.
        </p>
      </div>

      <section className="section">
        <h2 className="section__title">카테고리</h2>
        <div className="category-grid">
          {MOCK_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.iconKey];
            return (
              <div key={c.id} className="category-tile">
                <span className="category-tile__icon-wrap" aria-hidden>
                  <Icon
                    className="category-tile__icon"
                    width={20}
                    height={20}
                  />
                </span>
                <span className="category-tile__label">{c.label}</span>
                <span className="category-tile__count">{c.count}명</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">추천</h2>
        <ul className="featured-list">
          {MOCK_PROFILES.map((p) => (
            <li key={p.id} className="featured-card">
              <div
                className="featured-card__avatar"
                style={{ background: p.gradient }}
                aria-hidden
              />
              <div className="featured-card__body">
                <p className="featured-card__name">{p.name}</p>
                <p className="featured-card__desc">{p.tagline}</p>
              </div>
              <button
                type="button"
                className="btn btn--sm"
                disabled={!!liked[p.id]}
                onClick={() => like(p.id)}
              >
                {liked[p.id] ? "보냄" : "좋아요"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
