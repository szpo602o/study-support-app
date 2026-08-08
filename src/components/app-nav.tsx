"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "今週" },
  { href: "/daily", label: "日次" },
  { href: "/review", label: "週次" },
  { href: "/goals", label: "目標" },
  { href: "/history", label: "履歴" },
];

export function AppNav({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]"
        >
          コミット台帳
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-1 overflow-x-auto sm:gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <form action={signOutAction}>
            <button
              type="submit"
              className="ml-1 shrink-0 rounded-md px-2.5 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--wash)]"
            >
              退出
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
