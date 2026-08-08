# 学習コミットメントアプリ

自分専用の「自己コミットメント台帳」。  
遠い試験日を短期の約束へ分解し、計画と現実のずれをごまかせなくする。

## 技術構成

| 層 | 採用 |
|----|------|
| アプリ／デプロイ | **Next.js on Vercel** |
| DB（台帳の記憶） | **Neon（Postgres）+ Drizzle** |
| 認証 | Auth.js（単一ユーザー・パスワード） |

## セットアップ

1. Neon でデータベースを作成し、接続文字列を用意する
2. `.env.local` を作成（`.env.example` を参照）

```bash
cp .env.example .env.local
```

| 変数 | 意味 |
|------|------|
| `DATABASE_URL` | Neon の接続 URL |
| `AUTH_SECRET` | `openssl rand -base64 32` などで生成 |
| `APP_EMAIL` | 利用者のメール（users 行のキー） |
| `APP_PASSWORD` | ログイン用パスワード |

3. スキーマを反映

```bash
npm run db:push
```

4. 開発サーバー

```bash
npm run dev
```

## 画面

| パス | 内容 |
|------|------|
| `/` | 今週の一枚（目標・中間目標・当初タスク・差分） |
| `/daily` | 日次入力（スマホ最優先） |
| `/review` | 週次レビュー＋確定ロック |
| `/goals` | 目標・ロードマップ・中間目標・試験結果 |
| `/history` | 週単位の履歴カード |

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/02-運用リハーサル.md](docs/02-運用リハーサル.md) | 運用手順の参照 |
| [docs/03-MVPデータモデル.md](docs/03-MVPデータモデル.md) | テーブル・不変条件 |

## まだ後回し

- Web Push 通知（`users.daily_notify_at` はスキーマのみ）
- Vercel 本番デプロイ手順の自動化
