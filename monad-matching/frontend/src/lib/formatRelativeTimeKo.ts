/** 채팅 목록용 짧은 상대 시각 (한국어) */
export function formatRelativeTimeKo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "방금 전";
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfMsg = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  ).getTime();
  const dayDiff = Math.round((startOfToday - startOfMsg) / 86_400_000);
  if (dayDiff === 1) return "어제";
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
