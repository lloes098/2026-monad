import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { LocalProfile } from "../lib/localProfile";
import { loadLocalProfile, saveLocalProfile } from "../lib/localProfile";

const fields: { key: keyof LocalProfile; label: string; rows?: number }[] = [
  { key: "nickname", label: "닉네임" },
  { key: "bio", label: "자기소개", rows: 4 },
  { key: "school", label: "학교" },
  { key: "job", label: "직장" },
  { key: "interests", label: "관심사" },
  { key: "region", label: "지역" },
];

export function ProfileEditPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LocalProfile>(() => loadLocalProfile());

  function update<K extends keyof LocalProfile>(key: K, v: LocalProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveLocalProfile(form);
    navigate("/profile");
  }

  return (
    <div className="page">
      <div className="page__hero">
        <Link to="/profile" className="back-link">
          ← 프로필
        </Link>
        <h1 className="page__h">프로필 편집</h1>
        <p className="page__lede">
          지금은 이 기기 브라우저에만 저장돼요. 나중에 계정에 옮길 수 있어요.
        </p>
      </div>

      <form className="form-card" onSubmit={submit}>
        <p className="form-card__note">
          사진 업로드는 다음 단계에서 추가할 수 있어요.
        </p>
        {fields.map(({ key, label, rows }) => (
          <label key={key} className="field">
            <span className="field__label">{label}</span>
            {rows ? (
              <textarea
                className="field__input field__input--area"
                rows={rows}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            ) : (
              <input
                className="field__input"
                type="text"
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            )}
          </label>
        ))}
        <button type="submit" className="btn btn--primary btn--full">
          저장
        </button>
      </form>
    </div>
  );
}
