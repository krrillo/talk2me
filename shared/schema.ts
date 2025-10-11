import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - stores student and parent/therapist accounts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull().default("student"), // student, parent, therapist
  level: integer("level").notNull().default(1),
  experiencePoints: integer("experience_points").notNull().default(0),
  preferences: jsonb("preferences").default({}), // UI preferences, accessibility settings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stories table - generated stories with AI metadata
export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  level: integer("level").notNull(),
  theme: varchar("theme", { length: 50 }).notNull(),
  pages: jsonb("pages").notNull(), // Array of story pages with text and images
  aiMetadata: jsonb("ai_metadata"), // Generation prompts, model info, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercises table - games/activities linked to stories
export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  gameType: varchar("game_type", { length: 50 }).notNull(), // drag_words, order_sentence, etc.
  level: integer("level").notNull(),
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
