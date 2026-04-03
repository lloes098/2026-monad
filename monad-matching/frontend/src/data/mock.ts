/** 온체인 연동 전 UI 미리보기용 목 데이터 */

export type MatchStatus = "active" | "messaged" | "expired";

/** Heroicons (`@heroicons/react/24/outline`) 매핑용 키 */
export type CategoryIconKey =
  | "dev"
  | "design"
  | "art"
  | "climbing"
  | "coffee"
  | "onchain";

export type MockCategory = {
  id: string;
  label: string;
  count: number;
  iconKey: CategoryIconKey;
};

export type MockProfile = {
  id: string;
  name: string;
  tagline: string;
  /** 이미지 로드 실패 시 배경 (fallback) */
  gradient: string;
  /** 풀 카드용 포트레이트 (Unsplash 등 HTTPS) */
  photoUrl: string;
  /** 좋아요 대상 지갑 (로컬 Hardhat 기본 계정 1~3 — 계정 0은 보통 내 지갑) */
  targetAddress: `0x${string}`;
  /** 발견 탭 카테고리 필터 — `MOCK_CATEGORIES`의 id */
  categoryIds: string[];
};

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: "c1", label: "개발", count: 128, iconKey: "dev" },
  { id: "c2", label: "디자인", count: 64, iconKey: "design" },
  { id: "c3", label: "아트", count: 41, iconKey: "art" },
  { id: "c4", label: "클라이밍", count: 22, iconKey: "climbing" },
  { id: "c5", label: "커피", count: 18, iconKey: "coffee" },
  { id: "c6", label: "온체인", count: 56, iconKey: "onchain" },
];

export type MockMatch = {
  id: string;
  peerName: string;
  /** 라우팅·온체인 연동용 전체 주소 */
  peerAddress: `0x${string}`;
  matchedAtLabel: string;
  /** 0–100: 남은 시간 비율 (시각화용) */
  timeLeftPercent: number;
  firstMessageSent: boolean;
  expired: boolean;
  status: MatchStatus;
  /** 채팅 목록 미리보기 (목업) */
  lastPreview?: string;
};

export const MOCK_PROFILES: MockProfile[] = [
  {
    id: "1",
    name: "Mina",
    tagline: "온체인 아트 · 클라이밍",
    gradient: "linear-gradient(135deg, #3d2a4d 0%, #8b3a5c 55%, #c75b3d 100%)",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1200&fit=crop&q=80",
    targetAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    categoryIds: ["c3", "c4", "c6"],
  },
  {
    id: "2",
    name: "Jun",
    tagline: "Solidity · 커피",
    gradient: "linear-gradient(135deg, #1a2f2a 0%, #2d6a4f 50%, #95d5b2 100%)",
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1200&fit=crop&q=80",
    targetAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    categoryIds: ["c1", "c5"],
  },
  {
    id: "3",
    name: "Sora",
    tagline: "디자인 시스템 · 필름",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #f59e0b 100%)",
    photoUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&h=1200&fit=crop&q=80",
    targetAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    categoryIds: ["c2", "c3"],
  },
];

export const MOCK_MATCHES: MockMatch[] = [
  {
    id: "m1",
    peerName: "Mina",
    peerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    matchedAtLabel: "2시간 전",
    timeLeftPercent: 92,
    firstMessageSent: true,
    expired: false,
    status: "messaged",
    lastPreview: "내일 클라이밍 갈래?",
  },
  {
    id: "m2",
    peerName: "Jun",
    peerAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    matchedAtLabel: "어제",
    timeLeftPercent: 34,
    firstMessageSent: false,
    expired: false,
    status: "active",
    lastPreview: "매칭됐어요 👋",
  },
  {
    id: "m3",
    peerName: "레거시",
    peerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    matchedAtLabel: "3일 전",
    timeLeftPercent: 0,
    firstMessageSent: false,
    expired: true,
    status: "expired",
  },
];

export const MOCK_ME = {
  displayName: "You",
  address: "0xdD2…8421" as const,
  reputation: 0,
  matchExpiryHours: 48,
};
