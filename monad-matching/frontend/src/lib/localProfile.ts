/** 오프체인 프로필 MVP — 이후 Supabase 등으로 교체 */

export type LocalProfile = {
  nickname: string;
  bio: string;
  school: string;
  job: string;
  interests: string;
  region: string;
};

const STORAGE_KEY = "monad-matching-local-profile-v1";

const empty: LocalProfile = {
  nickname: "",
  bio: "",
  school: "",
  job: "",
  interests: "",
  region: "",
};

export function loadLocalProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    return { ...empty, ...parsed };
  } catch {
    return { ...empty };
  }
}

export function saveLocalProfile(p: LocalProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
