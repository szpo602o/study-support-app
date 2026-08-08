"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveStudyLog } from "@/actions/study";
import { IconCalendar, IconInfo } from "@/components/icons";
import { formatMinutes } from "@/lib/labels";
import {
  QUICK_MINUTES,
  ratingCssVar,
  studyRatingMessage,
} from "@/lib/study-rating";

export function TodayRecordCard({
  logDate,
  dateLabel,
  initialMinutes,
}: {
  logDate: string;
  dateLabel: string;
  initialMinutes: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState<number | null>(initialMinutes);
  const [draft, setDraft] = useState<number>(initialMinutes ?? 60);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const display = studyRatingMessage(minutes);
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
      setMinutes(value);
      setDraft(value);
      setOpen(false);
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
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">今日の記録</h2>
        <p className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <IconCalendar className="h-3.5 w-3.5" />
          {dateLabel}
        </p>
      </div>

      {!open && minutes === null && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-status-empty-bg)] px-2.5 py-1 text-xs font-medium text-[var(--color-status-empty)]">
              未入力
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              まだ記録がありません
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] border-2 border-[var(--color-accent)] bg-white text-sm font-semibold text-[var(--color-accent)]"
          >
            入力を開く ＞
          </button>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
            <IconInfo className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            タップすると記録入力画面が開きます
          </p>
        </div>
      )}

      {!open && minutes !== null && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color: ratingCssVar(display.rating),
                backgroundColor:
                  display.rating === "doubleCircle"
                    ? "var(--color-status-excellent-bg)"
                    : display.rating === "circle"
                      ? "var(--color-status-good-bg)"
                      : display.rating === "triangle"
                        ? "var(--color-status-fair-bg)"
                        : "var(--color-status-fail-bg)",
              }}
            >
              {display.label} {display.message}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-[32px] font-bold tabular-nums leading-none text-[var(--color-ink)]">
              {formatMinutes(minutes)}
            </p>
            <span
              className="text-2xl font-bold"
              style={{ color: ratingCssVar(display.rating) }}
            >
              {display.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] border-2 border-[var(--color-accent)] bg-white text-sm font-semibold text-[var(--color-accent)]"
          >
            修正する ＞
          </button>
        </div>
      )}

      {open && (
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
                  className={`h-[var(--quick-btn-h)] rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                    selected
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface-soft)] text-[var(--color-ink)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={1440}
              inputMode="numeric"
              placeholder="その他（分）"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                const n = Math.floor(Number(e.target.value));
                if (Number.isFinite(n) && n >= 0) setDraft(n);
              }}
              className="h-12 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (custom !== "") saveCustom();
                else save(draft);
              }}
              className="h-12 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "保存中…" : "保存"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-2 text-sm text-[var(--color-muted)]"
          >
            閉じる
          </button>

          {error && (
            <p className="text-sm text-[var(--color-status-fail)]">{error}</p>
          )}
        </div>
      )}
    </section>
  );
}
