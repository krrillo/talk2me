import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - stores student and parent/therapist accounts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(), // For Google OAuth and email-based auth
  googleId: varchar("google_id", { length: 255 }).unique(), // Google OAuth ID
  displayName: varchar("display_name", { length: 200 }), // Full name from Google
  photoUrl: text("photo_url"), // Profile photo URL
  role: varchar("role", { length: 20 }).notNull().default("student"), // student, parent, therapist, admin
  parentId: uuid("parent_id"), // For child accounts, points to parent (self-reference)
  emailVerified: boolean("email_verified").notNull().default(false),
  level: integer("level").notNull().default(1),
  experiencePoints: integer("experience_points").notNull().default(0),
  streak: integer("streak").notNull().default(0), // Consecutive days of activity
  lastActivityDate: varchar("last_activity_date", { length: 10 }), // YYYY-MM-DD for streak tracking
  preferences: jsonb("preferences").default({}), // UI preferences, accessibility settings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stories table - generated stories with AI metadata
export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  level: integer("level").notNull(), // 1-10
  theme: varchar("theme", { length: 50 }).notNull(),
  pages: jsonb("pages").notNull(), // Array of story pages with text and images
  vocabulary: jsonb("vocabulary").default([]), // Pre-teaching vocabulary with definitions and images
  wordCount: integer("word_count"), // Total words in story
  complexityIndex: integer("complexity_index"), // 1-10 complexity rating
  targets: jsonb("targets").default([]), // ["vocabulario", "tiempo verbal", "estructura gramatical"]
  aiMetadata: jsonb("ai_metadata"), // Generation prompts, model info, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercises table - games/activities linked to stories
export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  gameType: varchar("game_type", { length: 50 }).notNull(), // drag_words, order_sentence, complete_words, multi_choice, rewrite_sentence, find_error, contextual_choice
  level: integer("level").notNull(), // User level
  difficulty: integer("difficulty"), // 1-10 exercise difficulty
  focus: jsonb("focus").default([]), // ["ortografía", "semántica", "gramática"]
  exerciseData: jsonb("exercise_data").notNull(), // Game-specific configuration
  correctAnswer: jsonb("correct_answer").notNull(),
  hints: jsonb("hints").default([]),
  aiMetadata: jsonb("ai_metadata"), // Generation info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Progress table - tracks student performance
export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  correct: boolean("correct").notNull(),
  score: integer("score").notNull(), // 0-100
  pointsEarned: integer("points_earned").default(0), // Points from this exercise
  accuracy: real("accuracy"), // 0.0-1.0
  bonus: integer("bonus").default(0), // Bonus points (streak, perfect score, etc.)
  streak: integer("streak").default(0), // Current streak at time of completion
  timeSpent: integer("time_spent").notNull(), // seconds
  attempts: integer("attempts").notNull().default(1),
  responseData: jsonb("response_data"), // User's actual responses
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Assets table - generated images and media
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // image, audio, sprite
  storyId: uuid("story_id").references(() => stories.id),
  url: text("url").notNull(), // S3 URL or local path
  metadata: jsonb("metadata"), // DALL-E prompts, generation info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User sessions for progress tracking
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  activitiesCompleted: integer("activities_completed").default(0),
  totalScore: integer("total_score").default(0),
});

// Daily progress aggregates for analytics
export const dailyProgress = pgTable("daily_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  gamesPlayed: integer("games_played").default(0),
  averageScore: real("average_score").default(0),
  timeSpent: integer("time_spent").default(0), // minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Consents table - GDPR/COPPA compliance for consent tracking
export const consents = pgTable("consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(), // 'terms' or 'privacy'
  version: varchar("version", { length: 10 }).notNull(), // e.g., 'v1.0'
  accepted: boolean("accepted").notNull().default(true),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  ip: varchar("ip", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
});

// User Stories table - track user story history and status
export const userStories = pgTable("user_stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  level: integer("level").notNull().default(1), // Denormalized from story for efficient filtering
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, in_progress, completed
  pointsEarned: integer("points_earned").default(0),
  averageAccuracy: real("average_accuracy"), // 0.0-1.0
  totalTimeSpent: integer("total_time_spent").default(0), // seconds
  exercisesCompleted: integer("exercises_completed").default(0),
  lastPlayedAt: timestamp("last_played_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_stories_user_id").on(table.userId),
  userLevelIdx: index("idx_user_stories_user_level").on(table.userId, table.level),
  userStatusIdx: index("idx_user_stories_status").on(table.userId, table.status),
  userStoryIdx: index("idx_user_stories_user_story").on(table.userId, table.storyId),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectStorySchema = createSelectSchema(stories);

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const selectExerciseSchema = createSelectSchema(exercises);

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  completedAt: true,
});

export const selectProgressSchema = createSelectSchema(progress);

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export const selectAssetSchema = createSelectSchema(assets);

export const insertConsentSchema = createInsertSchema(consents).omit({
  id: true,
  acceptedAt: true,
});

export const selectConsentSchema = createSelectSchema(consents);

export const insertUserStorySchema = createInsertSchema(userStories).omit({
  id: true,
  createdAt: true,
});

export const selectUserStorySchema = createSelectSchema(userStories);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type InsertProgress = typeof progress.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;
export type UserStory = typeof userStories.$inferSelect;
export type InsertUserStory = typeof userStories.$inferInsert;
