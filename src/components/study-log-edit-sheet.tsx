"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveStudyLog } from "@/actions/study";
import {
  QUICK_MINUTES,
  ratingCssVar,
  studyRatingMessage,
} from "@/lib/study-rating";

export function StudyLogEditSheet({
  open,
  logDate,
  dateLabel,
  initialMinutes,
  onClose,
}: {
  open: boolean;
  logDate: string;
  dateLabel: string;
  initialMinutes: number | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialMinutes ?? 60);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDraft(initialMinutes ?? 60);
    setCustom("");
    setError(null);
  }, [open, initialMinutes, logDate]);

  if (!open) return null;

  const preview = studyRatingMessage(draft);

  function applyQuick(value: number) {
    setDraft(value);
    setCustom("");
  }

  function save(value: number) {
    setError(null);
    startTransition(async () => {
      const result = await saveStudyLog({ logDate, studyMinutes: value });
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function saveCustom() {
    const parsed = Math.floor(Number(custom));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("分数を入力してください");
      return;
    }
    save(parsed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-ink)_35%,transparent)]"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-log-edit-title"
        className="relative z-10 w-full max-w-[var(--content-max)] rounded-t-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:rounded-[var(--radius-lg)]"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2
              id="study-log-edit-title"
              className="section-title"
            >
              {initialMinutes === null ? "記録を入力" : "記録を修正"}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {dateLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--color-muted)]"
          >
            閉じる
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: ratingCssVar(preview.rating) }}
            >
              {preview.label}
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              {preview.message}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_MINUTES.map((m) => {
              const label = m === 90 ? "90分+" : `${m}分`;
              const selected = draft === m && custom === "";
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyQuick(m)}
                  className={`min-h-[var(--quick-btn-h)] rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                    selected
                      ? "bg-[var(--color-chalkboard)] text-[#f4f1e8]"
                      : "bg-[var(--color-surface-soft)] text-[var(--color-ink)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--color-muted)]">
              自由入力（分）
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="例: 45"
              value={custom}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                setCustom(raw);
                if (raw === "") return;
                const n = Math.floor(Number(raw));
                if (Number.isFinite(n) && n >= 0) setDraft(n);
              }}
              className="box-border h-12 w-full max-w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base tabular-nums"
            />
          </label>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (custom !== "") saveCustom();
              else save(draft);
            }}
            className="btn-chalkboard disabled:opacity-60"
          >
            {pending ? "保存中…" : "保存"}
          </button>

          {error && (
            <p className="text-sm text-[var(--color-status-fail)]">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
