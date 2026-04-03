import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";

import { CATEGORY_ICONS } from "../components/CategoryIcons";
import { matchingEngineAbi } from "../abis/matchingEngine";
import {
  MOCK_CATEGORIES,
  MOCK_PROFILES,
  type MockProfile,
} from "../data/mock";
import { useMyRegistration } from "../hooks/useMatchingEngine";

type RecoProfileCardProps = {
  profile: MockProfile;
  showActions?: boolean;
  isLikePending?: boolean;
  canLike?: boolean;
  actionsLocked?: boolean;
  onPass?: () => void;
  onLike?: () => void;
};

function RecoProfileCard({
  profile: p,
  showActions = true,
  isLikePending = false,
  canLike = true,
  actionsLocked = false,
  onPass,
  onLike,
}: RecoProfileCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [p.id]);

  return (
    <article className="reco-card">
      <div className="reco-card__media">
        <div className="reco-card__media-fill">
          {imgFailed ? (
            <div
              className="reco-card__fallback"
              style={{ background: p.gradient }}
              aria-hidden
            />
          ) : (
            <img
              className="reco-card__img"
              src={p.photoUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          )}
          <div className="reco-card__scrim" aria-hidden />
          <div className="reco-card__overlay">
            <div className="reco-card__meta">
              <h3 className="reco-card__name">{p.name}</h3>
              <p className="reco-card__tagline">{p.tagline}</p>
            </div>
          </div>
          {showActions && onPass && onLike ? (
            <div className="reco-card__dock">
              <p className="reco-card__addr-chip" title={p.targetAddress}>
                {p.targetAddress}
              </p>
              <div className="reco-card__actions">
                <button
                  type="button"
                  className="reco-card__btn reco-card__btn--pass"
                  disabled={actionsLocked || isLikePending}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onPass}
                >
                  패스
                </button>
                <button
                  type="button"
                  className="reco-card__btn reco-card__btn--like"
                  disabled={actionsLocked || isLikePending || !canLike}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onLike}
                >
                  {isLikePending ? "전송 중…" : "좋아요"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function DiscoverPage() {
  const { isConnected } = useAccount();
  const { contractAddress, isRegistered, isLoadingRegistration } =
    useMyRegistration();

  const [deckIndex, setDeckIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryFilterId, setCategoryFilterId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const exitHandledRef = useRef(false);

  const { writeContractAsync, isPending: isLikePending } = useWriteContract();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    if (!categoriesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoriesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [categoriesOpen]);

  const filteredProfiles: MockProfile[] = useMemo(() => {
    if (!categoryFilterId) return MOCK_PROFILES;
    return MOCK_PROFILES.filter((p) => p.categoryIds.includes(categoryFilterId));
  }, [categoryFilterId]);

  useEffect(() => {
    setDeckIndex(0);
    setExitDir(null);
    exitHandledRef.current = false;
  }, [categoryFilterId]);

  const currentProfile = filteredProfiles[deckIndex];
  const nextProfile = filteredProfiles[deckIndex + 1];
  const deckDone = deckIndex >= filteredProfiles.length;

  const activeCategoryLabel =
    MOCK_CATEGORIES.find((c) => c.id === categoryFilterId)?.label ?? null;

  const canLike =
    Boolean(contractAddress) &&
    isConnected &&
    isRegistered &&
    !isLoadingRegistration;

  const submitLikeOnChain = useCallback(
    async (target: `0x${string}`): Promise<boolean> => {
      if (!contractAddress) {
        showToast("좋아요를 쓰려면 앱에 매칭 계약이 연결되어 있어야 해요.");
        return false;
      }
      if (!isConnected) {
        showToast("먼저 지갑을 연결해 주세요.");
        return false;
      }
      if (isLoadingRegistration) return false;
      if (!isRegistered) {
        showToast("상단에서 온체인 등록을 먼저 해 주세요.");
        return false;
      }

      try {
        await writeContractAsync({
          address: contractAddress,
          abi: matchingEngineAbi,
          functionName: "likeUser",
          args: [target],
        });
        showToast("좋아요가 온체인에 기록됐어요.");
        return true;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "트랜잭션이 거절되었거나 실패했어요.";
        showToast(msg);
        return false;
      }
    },
    [
      contractAddress,
      isConnected,
      isLoadingRegistration,
      isRegistered,
      showToast,
      writeContractAsync,
    ],
  );

  function handlePass() {
    if (!currentProfile || exitDir || isLikePending) return;
    exitHandledRef.current = false;
    setExitDir("left");
  }

  async function handleLike() {
    if (!currentProfile || exitDir || isLikePending) return;
    exitHandledRef.current = false;
    const ok = await submitLikeOnChain(currentProfile.targetAddress);
    if (ok) setExitDir("right");
  }

  const passSwipeRef = useRef(handlePass);
  const likeSwipeRef = useRef(handleLike);
  passSwipeRef.current = handlePass;
  likeSwipeRef.current = handleLike;

  const [swipeDx, setSwipeDx] = useState(0);
  const [swipeDragging, setSwipeDragging] = useState(false);
  const swipeTracking = useRef(false);
  const swipeStartX = useRef(0);

  const SWIPE_THRESHOLD_PX = 72;

  const onSwipePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (exitDir || isLikePending) return;
      const el = e.target as HTMLElement;
      if (el.closest("button") || el.closest("a")) return;
      swipeTracking.current = true;
      swipeStartX.current = e.clientX;
      setSwipeDragging(true);
      setSwipeDx(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [exitDir, isLikePending],
  );

  const onSwipePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!swipeTracking.current || exitDir) return;
      setSwipeDx(e.clientX - swipeStartX.current);
    },
    [exitDir],
  );

  const finishSwipe = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!swipeTracking.current) return;
      swipeTracking.current = false;
      const dx = e.clientX - swipeStartX.current;
      setSwipeDragging(false);
      setSwipeDx(0);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (dx < -SWIPE_THRESHOLD_PX) {
        passSwipeRef.current();
      } else if (dx > SWIPE_THRESHOLD_PX) {
        void likeSwipeRef.current();
      }
    },
    [],
  );

  function handleDeckExitEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (!exitDir || !currentProfile) return;
    const name = e.animationName;
    if (
      !name.includes("reco-swipe-left") &&
      !name.includes("reco-swipe-right")
    ) {
      return;
    }
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;

    setExitDir(null);
    setDeckIndex((i) => i + 1);
  }

  function resetDeck() {
    setDeckIndex(0);
    setExitDir(null);
    exitHandledRef.current = false;
  }

  return (
    <div className="page page--discover">
      <div className="discover-top">
        <div className="page__hero">
          <h1 className="page__h">발견</h1>
          <p className="page__lede">
            상호 좋아요로 매칭되면 48시간 안에 첫 메시지 여부가 기록돼요.
          </p>
        </div>

        {!contractAddress ? (
          <p className="banner banner--warn">
            매칭 계약이 연결되면 좋아요가 체인으로 전송돼요.
          </p>
        ) : null}

        <button
          type="button"
          className="discover-categories-trigger"
          aria-expanded={categoriesOpen}
          aria-controls="discover-categories-panel"
          id="discover-categories-toggle"
          onClick={() => setCategoriesOpen((o) => !o)}
        >
          카테고리
          {activeCategoryLabel ? ` · ${activeCategoryLabel}` : ""}
          <ChevronDownIcon
            className="discover-categories-chevron"
            aria-hidden
          />
        </button>
      </div>

      <div className="discover-body">
        {categoriesOpen ? (
          <div className="discover-categories-overlay">
            <button
              type="button"
              className="discover-categories-scrim"
              aria-label="카테고리 닫기"
              onClick={() => setCategoriesOpen(false)}
            />
            <div
              className="discover-categories-panel"
              id="discover-categories-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="discover-categories-heading"
            >
              <div className="discover-categories-panel__head">
                <span className="discover-categories-panel__title" id="discover-categories-heading">
                  카테고리
                </span>
                <button
                  type="button"
                  className="discover-categories-panel__close"
                  onClick={() => setCategoriesOpen(false)}
                  aria-label="닫기"
                >
                  닫기
                </button>
              </div>
              <div className="category-grid discover-categories-panel__grid">
                <button
                  type="button"
                  className={[
                    "category-tile",
                    "category-tile--all",
                    categoryFilterId === null ? "category-tile--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={categoryFilterId === null}
                  onClick={() => {
                    setCategoryFilterId(null);
                    setCategoriesOpen(false);
                  }}
                >
                  <span className="category-tile__label">전체</span>
                  <span className="category-tile__count">필터 없음</span>
                </button>
                {MOCK_CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICONS[c.iconKey];
                  const selected = categoryFilterId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={[
                        "category-tile",
                        selected ? "category-tile--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={selected}
                      onClick={() => {
                        setCategoryFilterId(c.id);
                        setCategoriesOpen(false);
                      }}
                    >
                      <span className="category-tile__icon-wrap" aria-hidden>
                        <Icon
                          className="category-tile__icon"
                          width={20}
                          height={20}
                        />
                      </span>
                      <span className="category-tile__label">{c.label}</span>
                      <span className="category-tile__count">{c.count}명</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="discover-deck-pane">
          <div className="discover-deck-pane__head">
            <h2 className="discover-deck-pane__title">추천</h2>

          </div>
          <div className="reco-deck-wrap">
            {deckDone ? (
              <div className="reco-deck-empty">
                <p className="reco-deck-empty__text">
                  지금 보여줄 추천이 없어요.
                </p>
                <button
                  type="button"
                  className="btn btn--ghost reco-deck-empty__btn"
                  onClick={resetDeck}
                >
                  처음부터 다시
                </button>
              </div>
            ) : (
              <div className="reco-deck">
                {nextProfile ? (
                  <div className="reco-deck__peek" aria-hidden>
                    <RecoProfileCard profile={nextProfile} showActions={false} />
                  </div>
                ) : null}
                {currentProfile ? (
                  <div
                    className={[
                      "reco-deck__shell",
                      exitDir ? `reco-deck__shell--exit-${exitDir}` : "",
                      swipeDragging ? "reco-deck__shell--dragging" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      exitDir
                        ? undefined
                        : swipeDragging || swipeDx !== 0
                          ? {
                              transform: `translateX(${swipeDx}px) rotate(${swipeDx * 0.035}deg)`,
                            }
                          : undefined
                    }
                    onPointerDown={onSwipePointerDown}
                    onPointerMove={onSwipePointerMove}
                    onPointerUp={finishSwipe}
                    onPointerCancel={finishSwipe}
                    onAnimationEnd={handleDeckExitEnd}
                  >
                    <RecoProfileCard
                      profile={currentProfile}
                      isLikePending={isLikePending}
                      canLike={canLike}
                      actionsLocked={Boolean(exitDir)}
                      onPass={handlePass}
                      onLike={handleLike}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
