import { todayDateString } from "@/lib/dates";
import { STATIC_QUOTES } from "./static-quotes";
import type {
  DailyQuoteContext,
  DailyQuoteProvider,
  ResolvedDailyQuote,
} from "./types";

export type {
  DailyQuote,
  DailyQuoteContext,
  DailyQuoteProvider,
  QuoteCategory,
  ResolvedDailyQuote,
} from "./types";

/** YYYY-MM-DD を決定的な整数に変換（同日は常に同じ値） */
export function hashDateSeed(date: string): number {
  let hash = 2166136261;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickStaticQuote(date: string): ResolvedDailyQuote {
  const index = hashDateSeed(date) % STATIC_QUOTES.length;
  const picked = STATIC_QUOTES[index]!;
  return {
    ...picked,
    source: "static",
    date,
  };
}

/**
 * 静的名言プロバイダ。
 * 将来 AI プロバイダに差し替える／フォールバック先として使う。
 */
export const staticDailyQuoteProvider: DailyQuoteProvider = {
  getQuote(date: string, _context?: DailyQuoteContext) {
    return pickStaticQuote(date);
  },
};

let activeProvider: DailyQuoteProvider = staticDailyQuoteProvider;

/** 将来の AI 生成プロバイダ差し替え用 */
export function setDailyQuoteProvider(provider: DailyQuoteProvider) {
  activeProvider = provider;
}

export function resetDailyQuoteProvider() {
  activeProvider = staticDailyQuoteProvider;
}

/**
 * その日の「今日の言葉」を返す。
 * 日付を seed にするため、同日中はリロードしても同じ名言になる。
 *
 * @param date YYYY-MM-DD。省略時は今日
 * @param context 将来の AI 生成向け学習コンテキスト（初期実装では未使用）
 */
export async function getDailyQuote(
  date: string = todayDateString(),
  context?: DailyQuoteContext,
): Promise<ResolvedDailyQuote> {
  return activeProvider.getQuote(date, context);
}

/** 同期版（静的プロバイダ前提。カード描画など向け） */
export function getDailyQuoteSync(
  date: string = todayDateString(),
  context?: DailyQuoteContext,
): ResolvedDailyQuote {
  const result = activeProvider.getQuote(date, context);
  if (result instanceof Promise) {
    // AI プロバイダ利用時は getDailyQuote を使う
    return pickStaticQuote(date);
  }
  return result;
}
