"use client";

import { FormEvent, useMemo, useState } from "react";
import { PASSWORD_CHANGE_HINT } from "@/lib/password";
import { hrApi } from "@/lib/hr-api";

interface ChangeOwnPasswordModalProps {
  userName: string;
  onClose: () => void;
}

export function ChangeOwnPasswordModal({
  userName,
  onClose,
}: ChangeOwnPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const mismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = useMemo(() => {
    return (
      newPassword.length > 0 &&
      confirmPassword.length > 0 &&
      newPassword === confirmPassword &&
      !isSaving
    );
  }, [confirmPassword, isSaving, newPassword]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(hrApi("/auth/change-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "변경 실패");
      setInfo("비밀번호가 변경되었습니다.");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => onClose(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경 실패");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <h2
          id="change-password-title"
          className="text-lg font-bold text-[#004b87]"
        >
          비밀번호 변경
        </h2>
        <p className="mt-1 text-sm text-slate-600">{userName}</p>
        <p className="mt-2 text-xs text-slate-500">{PASSWORD_CHANGE_HINT}</p>
        <p className="mt-1 text-xs text-slate-500">
          새 비밀번호와 확인 비밀번호가 일치해야 변경됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              새 비밀번호
            </label>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              새 비밀번호 확인
            </label>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                mismatch
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 focus:border-[#009ada] focus:ring-[#009ada]/20"
              }`}
            />
            {mismatch ? (
              <p className="mt-1 text-xs text-red-600">
                새 비밀번호와 일치하지 않습니다.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {info}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#004b87] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#003a6b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "변경 중..." : "변경"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
