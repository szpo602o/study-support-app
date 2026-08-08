# MVP データモデル草案

Vercel（Next.js）＋ Neon（Postgres）前提の最小エンティティ。関係と不変条件を固定する。

## エンティティ関係

```text
User (単一利用者)
  └─ Goal (アクティブ最大2 / 終了後は archived)
       ├─ RoadmapItem (5〜10)
       ├─ Milestone (現在フォーカスの中間目標。RoadmapItem を指す)
       └─ ExamResult (合否必須・点数任意)

Week (月曜開始・日曜終了)
  ├─ WeeklyPlanSnapshot (当初計画。作成後は不変)
  ├─ WeeklyTask (当初 / 途中追加。変更は履歴として残す)
  ├─ DailyLog (日付ごと。時間区分＋取り組んだタスク)
  └─ WeekReview (確定後ロック)
```

## テーブル案

### users

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| email | text | 認証連携 |
| daily_notify_at | time | 日次通知時刻 |
| created_at | timestamptz | |

### goals

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK |
| title | text | 例: 中小企業診断士一次合格 |
| exam_date | date | 締切 |
| status | enum | `active` / `archived` |
| archived_at | timestamptz | nullable |
| created_at | timestamptz | |

制約: `status = active` はユーザーあたり最大2。

### roadmap_items

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| goal_id | uuid | FK |
| title | text | 例: 財務・会計の講義一周 |
| target_date | date | 本人設定 |
| sort_order | int | 1..10 程度 |
| status | enum | `pending` / `current` / `done` / `dropped` |
| original_target_date | date | 初回目標日（変更前を残す） |

### milestones

現在フォーカス中の中間目標。ロードマップ段階へのポインタ。

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| goal_id | uuid | FK |
| roadmap_item_id | uuid | FK |
| due_date | date | 作成時点から2週間以内 |
| status | enum | `active` / `done` / `overdue` / `replaced` |
| decision | enum | nullable。遅延時: `catch_up` / `change_date` / `shrink_scope` |
| created_at | timestamptz | |

制約: goal あたり `status = active` は最大1。

### weeks

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK |
| start_date | date | 月曜 |
| end_date | date | 日曜 |
| status | enum | `open` / `reviewed` |
| reviewed_at | timestamptz | nullable |
| created_at | timestamptz | |

### weekly_tasks

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| week_id | uuid | FK |
| goal_id | uuid | FK |
| title | text | |
| estimated_minutes_code | enum | `15` / `30` / `60` / `120` / `180_plus` |
| origin | enum | `initial` / `mid_week_add` / `recommit` |
| status | enum | `open` / `done` / `dropped` |
| created_at | timestamptz | 後付け計画の証拠になる |
| completed_at | timestamptz | nullable |

### weekly_plan_snapshots

週の「当初計画」を不変で残す。

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| week_id | uuid | FK |
| snapshot_json | jsonb | 作成時点のタスク一覧・想定時間 |
| captured_at | timestamptz | |

週に対して最初のコミット時に1回作成。以降更新しない。

### plan_changes

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| week_id | uuid | FK |
| task_id | uuid | FK nullable |
| change_type | enum | `add` / `edit_title` / `edit_estimate` / `drop` |
| before_json | jsonb | |
| after_json | jsonb | |
| created_at | timestamptz | |

### daily_logs

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| week_id | uuid | FK |
| log_date | date | |
| time_bucket | enum | `0` / `1_14` / `15_29` / `30_59` / `60_119` / `120_plus` |
| entered_at | timestamptz | |
| is_late_entry | bool | log_date より後の入力なら true |
| unique(week_id, log_date) | | 1日1行 |

### daily_log_tasks

その日に取り組んだ／完了したタスク。

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| daily_log_id | uuid | FK |
| weekly_task_id | uuid | FK |
| worked | bool | 取り組んだ |
| completed | bool | その日に完了 |

`time_bucket = 0` の日は行を持たなくてよい。

### week_reviews

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| week_id | uuid | FK unique |
| summary_json | jsonb | 完了数・想定/実績概算・変更件数など |
| locked_at | timestamptz | 確定時刻。以降 week 配下は更新不可 |

### incomplete_task_reviews

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| week_review_id | uuid | FK |
| weekly_task_id | uuid | FK |
| reason | enum | `no_time` / `overestimate` / `priority_change` / `avoidance` / `other` |
| disposition | enum | `recommit` / `defer` / `drop` |

### exam_results

| カラム | 型 | メモ |
|--------|-----|------|
| id | uuid | PK |
| goal_id | uuid | FK unique |
| passed | bool | 必須 |
| score | numeric | 任意 |
| recorded_at | timestamptz | |

## 不変条件（アプリ側で必ず守る）

1. `weekly_plan_snapshots` は作成後更新しない
2. `weeks.status = reviewed` のあと、その週の tasks / daily_logs / plan_changes は更新しない
3. 当初達成の集計は `origin = initial` のみ。`mid_week_add` は別計上
4. アクティブ Goal は最大2。削除APIは公開しない
5. Milestone の `due_date` は作成時に「今日＋14日」以内
6. 日次の遡及入力は「その週が open の間」かつ `is_late_entry` を立てる

## 画面との対応

| 画面 | 主に読むデータ |
|------|----------------|
| 今週の一枚 | goals, milestones, weekly_tasks, daily_logs（当週）, 差分集計 |
| 日次入力 | weekly_tasks（open）, daily_logs |
| 週次レビュー | snapshot, tasks, logs, incomplete reviews |
| 履歴 | weeks（時系列カード）＋ summary_json |
| 目標設定 | goals, roadmap_items, milestones |
| 結果記録 | exam_results |

## 実装順序の提案

1. Goal / Roadmap / Milestone の CRUD（削除なし）
2. Week / WeeklyTask / Snapshot
3. DailyLog（スマホ最優先UI）
4. WeekReview ＋ lock
5. 履歴カード
6. Neon 接続＋認証（Vercel にデプロイ）
7. 通知（Web Push、不可時はアプリ内強調）
