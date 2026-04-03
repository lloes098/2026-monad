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
  gradient: string;
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
  peerAddress: `0x${string}`;
  matchedAtLabel: string;
  /** 0–100: 남은 시간 비율 (시각화용) */
  timeLeftPercent: number;
  firstMessageSent: boolean;
  expired: boolean;
  status: MatchStatus;
};

export const MOCK_PROFILES: MockProfile[] = [
  {
    id: "1",
    name: "Mina",
    tagline: "온체인 아트 · 클라이밍",
    gradient: "linear-gradient(135deg, #3d2a4d 0%, #8b3a5c 55%, #c75b3d 100%)",
  },
  {
    id: "2",
    name: "Jun",
    tagline: "Solidity · 커피",
    gradient: "linear-gradient(135deg, #1a2f2a 0%, #2d6a4f 50%, #95d5b2 100%)",
  },
  {
    id: "3",
    name: "Sora",
    tagline: "디자인 시스템 · 필름",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #f59e0b 100%)",
  },
];

export const MOCK_MATCHES: MockMatch[] = [
  {
    id: "m1",
    peerName: "Mina",
    peerAddress: "0x71C…9A2e",
    matchedAtLabel: "2시간 전",
    timeLeftPercent: 92,
    firstMessageSent: true,
    expired: false,
    status: "messaged",
  },
  {
    id: "m2",
    peerName: "Jun",
    peerAddress: "0x4F2…b81c",
    matchedAtLabel: "어제",
    timeLeftPercent: 34,
    firstMessageSent: false,
    expired: false,
    status: "active",
  },
  {
    id: "m3",
    peerName: "레거시",
    peerAddress: "0x9c1…0040",
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
