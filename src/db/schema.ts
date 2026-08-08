import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "archived",
]);
export const roadmapStatusEnum = pgEnum("roadmap_status", [
  "pending",
  "current",
  "done",
  "dropped",
]);
export const milestoneStatusEnum = pgEnum("milestone_status", [
  "active",
  "done",
  "overdue",
  "replaced",
]);
export const milestoneDecisionEnum = pgEnum("milestone_decision", [
  "catch_up",
  "change_date",
  "shrink_scope",
]);
export const weekStatusEnum = pgEnum("week_status", ["open", "reviewed"]);
export const estimateCodeEnum = pgEnum("estimate_minutes_code", [
  "15",
  "30",
  "60",
  "120",
  "180_plus",
]);
export const taskOriginEnum = pgEnum("task_origin", [
  "initial",
  "mid_week_add",
  "recommit",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "done",
  "dropped",
]);
export const planChangeTypeEnum = pgEnum("plan_change_type", [
  "add",
  "edit_title",
  "edit_estimate",
  "drop",
]);
export const timeBucketEnum = pgEnum("time_bucket", [
  "0",
  "1_14",
  "15_29",
  "30_59",
  "60_119",
  "120_plus",
]);
export const incompleteReasonEnum = pgEnum("incomplete_reason", [
  "no_time",
  "overestimate",
  "priority_change",
  "avoidance",
  "other",
]);
export const incompleteDispositionEnum = pgEnum("incomplete_disposition", [
  "recommit",
  "defer",
  "drop",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  dailyNotifyAt: time("daily_notify_at"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  examDate: date("exam_date").notNull(),
  status: goalStatusEnum("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const roadmapItems = pgTable("roadmap_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id),
  title: text("title").notNull(),
  targetDate: date("target_date").notNull(),
  originalTargetDate: date("original_target_date").notNull(),
  sortOrder: integer("sort_order").notNull(),
  status: roadmapStatusEnum("status").notNull().default("pending"),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id),
  roadmapItemId: uuid("roadmap_item_id")
    .notNull()
    .references(() => roadmapItems.id),
  dueDate: date("due_date").notNull(),
  status: milestoneStatusEnum("status").notNull().default("active"),
  decision: milestoneDecisionEnum("decision"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const weeks = pgTable(
  "weeks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: weekStatusEnum("status").notNull().default("open"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("weeks_user_start_unique").on(table.userId, table.startDate),
  ],
);

export const weeklyTasks = pgTable("weekly_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id")
    .notNull()
    .references(() => weeks.id),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id),
  title: text("title").notNull(),
  estimatedMinutesCode: estimateCodeEnum("estimated_minutes_code").notNull(),
  origin: taskOriginEnum("origin").notNull().default("initial"),
  status: taskStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const weeklyPlanSnapshots = pgTable("weekly_plan_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id")
    .notNull()
    .references(() => weeks.id)
    .unique(),
  snapshotJson: jsonb("snapshot_json").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const planChanges = pgTable("plan_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id")
    .notNull()
    .references(() => weeks.id),
  taskId: uuid("task_id").references(() => weeklyTasks.id),
  changeType: planChangeTypeEnum("change_type").notNull(),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dailyLogs = pgTable(
  "daily_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => weeks.id),
    logDate: date("log_date").notNull(),
    timeBucket: timeBucketEnum("time_bucket").notNull(),
    enteredAt: timestamp("entered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isLateEntry: boolean("is_late_entry").notNull().default(false),
  },
  (table) => [
    uniqueIndex("daily_logs_week_date_unique").on(table.weekId, table.logDate),
  ],
);

export const dailyLogTasks = pgTable("daily_log_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  dailyLogId: uuid("daily_log_id")
    .notNull()
    .references(() => dailyLogs.id),
  weeklyTaskId: uuid("weekly_task_id")
    .notNull()
    .references(() => weeklyTasks.id),
  worked: boolean("worked").notNull().default(true),
  completed: boolean("completed").notNull().default(false),
});

export const weekReviews = pgTable("week_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id")
    .notNull()
    .references(() => weeks.id)
    .unique(),
  summaryJson: jsonb("summary_json").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const incompleteTaskReviews = pgTable("incomplete_task_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekReviewId: uuid("week_review_id")
    .notNull()
    .references(() => weekReviews.id),
  weeklyTaskId: uuid("weekly_task_id")
    .notNull()
    .references(() => weeklyTasks.id),
  reason: incompleteReasonEnum("reason").notNull(),
  disposition: incompleteDispositionEnum("disposition").notNull(),
});

export const examResults = pgTable("exam_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id)
    .unique(),
  passed: boolean("passed").notNull(),
  score: numeric("score"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** 新UI用: 日次の学習分数（判定記号は保存しない） */
export const studyLogs = pgTable(
  "study_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    logDate: date("log_date").notNull(),
    studyMinutes: integer("study_minutes").notNull(),
    goalId: uuid("goal_id").references(() => goals.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("study_logs_user_date_unique").on(table.userId, table.logDate),
  ],
);

/** 新UI用: 週ごとの目標テキスト（最大2件想定） */
export const weeklyGoals = pgTable(
  "weekly_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id),
    weekStart: date("week_start").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("weekly_goals_user_week_goal_unique").on(
      table.userId,
      table.weekStart,
      table.goalId,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  goals: many(goals),
  weeks: many(weeks),
  studyLogs: many(studyLogs),
  weeklyGoals: many(weeklyGoals),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  roadmapItems: many(roadmapItems),
  milestones: many(milestones),
  examResult: one(examResults),
  weeklyGoals: many(weeklyGoals),
}));

export const roadmapItemsRelations = relations(roadmapItems, ({ one }) => ({
  goal: one(goals, {
    fields: [roadmapItems.goalId],
    references: [goals.id],
  }),
}));

export const weeksRelations = relations(weeks, ({ one, many }) => ({
  user: one(users, { fields: [weeks.userId], references: [users.id] }),
  tasks: many(weeklyTasks),
  snapshot: one(weeklyPlanSnapshots),
  dailyLogs: many(dailyLogs),
  review: one(weekReviews),
  planChanges: many(planChanges),
}));
