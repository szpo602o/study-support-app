/** 勉強・継続に関する名言のカテゴリ */
export type QuoteCategory =
  | "勉強"
  | "継続"
  | "努力"
  | "挑戦"
  | "失敗"
  | "習慣"
  | "成長";

export type DailyQuote = {
  quote: string;
  author: string;
  category: QuoteCategory;
};

/** 表示用。将来の AI 生成時は source が "ai" になる */
export type ResolvedDailyQuote = DailyQuote & {
  source: "static" | "ai";
  date: string;
};

/**
 * 将来の AI「今日の一言」生成向けコンテキスト。
 * 初期実装では未使用。学習実績に応じた生成時に渡す。
 */
export type DailyQuoteContext = {
  recentStudyMinutes?: number;
  streakDays?: number;
  goalTitles?: string[];
};

export type DailyQuoteProvider = {
  getQuote(
    date: string,
    context?: DailyQuoteContext,
  ): ResolvedDailyQuote | Promise<ResolvedDailyQuote>;
};
