"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconChart, IconHome, IconReportCard } from "@/components/icons";

const tabs = [
  { href: "/", label: "ホーム", Icon: IconHome },
  { href: "/reflect", label: "振り返り", Icon: IconChart },
  { href: "/grades", label: "成績表", Icon: IconReportCard },
] as const;

export function AppNav({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-10 w-full max-w-[var(--content-max)] items-center justify-end px-3">
          <div className="relative">
            <button
              type="button"
              aria-label="メニュー"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-surface)]"
            >
              <span className="text-lg leading-none">⋯</span>
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-30 cursor-default"
                  aria-label="閉じる"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-40 mt-1 min-w-[140px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
                  <Link
                    href="/goals"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                  >
                    目標の管理
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full px-4 py-3 text-left text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]"
                    >
                      ログアウト
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <nav
        className="nav-schoolbook fixed inset-x-0 bottom-0 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid h-[var(--nav-h)] max-w-[var(--content-max)] grid-cols-3">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            const { Icon } = tab;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-[#f4f1e8]"
                    : "text-[color-mix(in_oklab,#f4f1e8_62%,transparent)]"
                }`}
              >
                {active && (
                  <span className="absolute inset-x-3 top-1.5 bottom-1.5 rounded-md bg-[color-mix(in_oklab,white_12%,transparent)]" />
                )}
                <Icon className="relative z-[1] h-5 w-5" />
                <span className="relative z-[1]">{tab.label}</span>
                {active && (
                  <span className="absolute bottom-1.5 z-[1] h-0.5 w-8 rounded-full bg-[#f4f1e8]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
