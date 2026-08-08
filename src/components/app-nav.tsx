"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconChart, IconHome } from "@/components/icons";

const tabs = [
  { href: "/", label: "ホーム", Icon: IconHome },
  { href: "/reflect", label: "振り返り", Icon: IconChart },
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
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-line)] bg-[var(--color-surface)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid h-[var(--nav-h)] max-w-[var(--content-max)] grid-cols-2">
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
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute bottom-1.5 h-0.5 w-8 rounded-full bg-[var(--color-accent)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
