import { langchainService } from "./langchainService";
import { db } from "@/lib/db";
import { stories, assets, insertStorySchema, insertAssetSchema } from "@shared/schema";
import { StoryGenerateRequest, Theme, AIMetadata } from "@shared/types";
import { validateContentSafety, validateGrammarLevel } from "@shared/validation";
import crypto from "crypto";

export class StoryGeneratorService {
  async generateStory(request: StoryGenerateRequest): Promise<{
    storyId: string;
    title: string;
    pages: Array<{ text: string; image?: string }>;
    level: number;
    theme: string;
  }> {
    try {
      console.log(`Generating story: theme=${request.theme}, level=${request.level}`);

      // Generate story content using LangChain
      const generated = await langchainService.generateStoryWithExercises(request);
      
      if (!generated.story || !generated.story.pages || generated.story.pages.length === 0) {
        throw new Error("Generated story is empty or invalid");
      }

      // Validate content safety
      const fullText = generated.story.pages.map(p => p.text).join(' ');
      if (!validateContentSafety(fullText)) {
        console.warn("Story failed content safety check, regenerating...");
        // In production, you might retry with modified prompts
        throw new Error("Generated content failed safety validation");
      }

      // Validate grammar level appropriateness
      const grammarIssues = validateGrammarLevel(fullText, request.level);
      if (grammarIssues.length > 2) {
        console.warn("Story has too many grammar issues for level:", grammarIssues);
      }

      // Generate images for each page
      const pagesWithImages = await Promise.all(
        generated.story.pages.map(async (page: any, index: number) => {
          let imageUrl: string | undefined;
          
          if (page.imagePrompt) {
            try {
              imageUrl = await langchainService.generateImage(
                `${page.imagePrompt}. Theme: ${request.theme}`,
                "flat-illustration-child-friendly"
              );
              
              // Store asset reference
              if (imageUrl) {
                await this.storeAsset({
                  type: "image",
                  url: imageUrl,
                  metadata: {
                    prompt: page.imagePrompt,
                    theme: request.theme,
                    pageIndex: index,
                    generatedAt: new Date().toISOString(),
                  },
                });
              }
            } catch (error) {
              console.error(`Error generating image for page ${index}:`, error);
              // Continue without image
            }
          }

          return {
            text: page.text,
            image: imageUrl,
          };
        })
      );

      // Create AI metadata
      const aiMetadata: AIMetadata = {
        model: "gpt-5",
        promptHash: crypto.createHash('sha256')
          .update(`${request.theme}-${request.level}-story`)
          .digest('hex'),
        generatedAt: new Date().toISOString(),
        parameters: {
          theme: request.theme,
          level: request.level,
          constraints: request.constraints,
        },
      };

      // Store story in database
      const storyData = {
        title: generated.story.title,
        level: request.level,
        theme: request.theme,
        pages: pagesWithImages,
        aiMetadata,
      };

      const validatedStory = insertStorySchema.parse(storyData);
      const [savedStory] = await db
        .insert(stories)
        .values(validatedStory)
        .returning();

      console.log(`Story generated successfully: ${savedStory.id}`);

      return {
        storyId: savedStory.id,
        title: savedStory.title,
        pages: pagesWithImages,
        level: savedStory.level,
        theme: savedStory.theme,
      };

    } catch (error) {
      console.error("Error generating story:", error);
      throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStoryById(storyId: string): Promise<any | null> {
    try {
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      return story || null;
    } catch (error) {
      console.error("Error fetching story:", error);
      return null;
    }
  }

  async getStoriesByLevel(level: number, limit: number = 10): Promise<any[]> {
    try {
      const storyList = await db
        .select({
          id: stories.id,
          title: stories.title,
          level: stories.level,
          theme: stories.theme,
          createdAt: stories.createdAt,
        })
        .from(stories)
        .where(eq(stories.level, level))
        .orderBy(desc(stories.createdAt))
        .limit(limit);

      return storyList;
    } catch (error) {
      console.error("Error fetching stories by level:", error);
      return [];
    }
  }

  async getStoriesByTheme(theme: string, limit: number = 10): Promise<any[]> {
    try {
      const storyList = await db
        .select({
          id: stories.id,
          title: stories.title,
          level: stories.level,
          theme: stories.theme,
          createdAt: stories.createdAt,
        })
        .from(stories)
        .where(eq(stories.theme, theme))
        .orderBy(desc(stories.createdAt))
        .limit(limit);

      return storyList;
    } catch (error) {
      console.error("Error fetching stories by theme:", error);
      return [];
    }
  }

  private async storeAsset(assetData: {
    type: string;
    url: string;
    metadata: any;
    storyId?: string;
  }) {
    try {
      const validatedAsset = insertAssetSchema.parse(assetData);
      await db.insert(assets).values(validatedAsset);
    } catch (error) {
      console.error("Error storing asset:", error);
      // Don't throw - asset storage is not critical
    }
  }

  async generateThemeVariations(theme: Theme, level: number): Promise<string[]> {
    try {
      // Generate story ideas/variations for a given theme
      const variations = await langchainService.generateStoryWithExercises({
        theme,
        level,
        locale: "es-ES",
      });

      // Extract different story concepts that could be generated
      const concepts = [
        `${theme} adventure`,
        `${theme} friendship story`, 
        `${theme} learning experience`,
        `${theme} problem solving`,
        `${theme} discovery tale`,
      ];

      return concepts;
    } catch (error) {
      console.error("Error generating theme variations:", error);
      return [`Basic ${theme} story`];
    }
  }

  async validateStoryQuality(storyText: string, level: number): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Word count validation
    const wordCount = storyText.split(/\s+/).length;
    const expectedRange = this.getWordCountRange(level);
    
    if (wordCount < expectedRange[0]) {
      issues.push("Story too short for level");
      suggestions.push("Add more descriptive details");
    } else if (wordCount > expectedRange[1]) {
      issues.push("Story too long for level");
      suggestions.push("Simplify some sentences");
    }

    // Grammar level validation
    const grammarIssues = validateGrammarLevel(storyText, level);
    issues.push(...grammarIssues);

    // Content safety check
    if (!validateContentSafety(storyText)) {
      issues.push("Content safety concerns");
      suggestions.push("Remove inappropriate content");
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  private getWordCountRange(level: number): [number, number] {
    const ranges = {
      1: [50, 80],
      2: [80, 100],
      3: [100, 130],
      4: [130, 160],
      5: [150, 200],
    };
    
    return ranges[level as keyof typeof ranges] || [50, 80];
  }
}

export const storyGeneratorService = new StoryGeneratorService();
