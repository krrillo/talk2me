import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, insertUserSchema } from "@shared/schema";
import { InsertUser, User } from "@shared/schema";
import crypto from "crypto";

export class AuthService {
  async createOrGetUser(username: string): Promise<User> {
    try {
      // First try to find existing user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser.length > 0) {
        return existingUser[0];
      }

      // Create new user if doesn't exist
      const newUserData: InsertUser = {
        username,
        role: "student",
        level: 1,
        experiencePoints: 0,
        preferences: {
          theme: "light",
          fontSize: "normal",
          soundEnabled: true,
          animationsEnabled: true,
        },
      };

      // Validate user data
      const validatedData = insertUserSchema.parse(newUserData);

      const [newUser] = await db
        .insert(users)
        .values(validatedData)
        .returning();

      return newUser;
    } catch (error) {
      console.error("Error creating or getting user:", error);
      throw new Error("Failed to authenticate user");
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  async updateUserLevel(userId: string, newLevel: number, experiencePoints: number): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          level: newLevel, 
          experiencePoints,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error("Error updating user level:", error);
      return false;
    }
  }

  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          preferences,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      return false;
    }
  }

  // Simple token generation for demo purposes
  generateUserToken(user: User): string {
    // In production, use JWT or proper session management
    const tokenData = `${user.username}:${user.id}:${user.level}`;
    return Buffer.from(tokenData).toString('base64');
  }

  // Simple session ID generation
  generateSessionId(user: User): string {
    const sessionData = `${user.username}:${user.id}:${user.level}`;
    return Buffer.from(sessionData).toString('base64');
  }

  // Validate and decode simple token
  decodeUserToken(token: string): { username: string; id: string; level: number } | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username, id, level] = decoded.split(':');
      
      if (!username || !id || !level) {
        return null;
      }

      return { username, id, level: parseInt(level) || 1 };
    } catch {
      return null;
    }
  }

  // Calculate user badges based on progress
  async calculateUserBadges(userId: string): Promise<string[]> {
    const badges: string[] = [];
    
    try {
      // This would query the progress table to determine badges
      // For now, return some basic badges
      const user = await this.getUserById(userId);
      if (!user) return badges;

      if (user.experiencePoints >= 100) {
        badges.push("first_game");
      }
      
      if (user.experiencePoints >= 500) {
        badges.push("persistent");
      }
      
      if (user.level >= 3) {
        badges.push("grammar_master");
      }

      if (user.level >= 5) {
        badges.push("vocabulary_champion");
      }

      return badges;
    } catch (error) {
      console.error("Error calculating badges:", error);
      return [];
    }
  }
}

export const authService = new AuthService();
