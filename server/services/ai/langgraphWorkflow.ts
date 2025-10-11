import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { LangChainOrchestrator } from "./langchainService.js";
import { db } from "../../lib/db.js";
import { stories, exercises, assets } from "@shared/schema";

interface WorkflowState {
  userId: string;
  level: number;
  theme?: string;
  storyId?: string;
  storyContent?: any;
  storyPages?: any[];
  imageUrls?: string[];
  exercises?: any[];
  exercisesGenerated?: boolean;
  error?: string;
}

export class MultimodalLearningWorkflow {
  private orchestrator: LangChainOrchestrator;
  private graph: any;

  constructor() {
    this.orchestrator = new LangChainOrchestrator();
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph<WorkflowState>({
      channels: {
        userId: null,
        level: null,
        theme: null,
        storyId: null,
        storyContent: null,
        storyPages: null,
        imageUrls: null,
        exercises: null,
        exercisesGenerated: null,
        error: null,
      }
    });

    workflow.addNode("generate_story", this.generateStoryNode.bind(this));
    workflow.addNode("generate_images", this.generateImagesNode.bind(this));
    workflow.addNode("save_story", this.saveStoryNode.bind(this));
    workflow.addNode("generate_exercises", this.generateExercisesNode.bind(this));
    workflow.addNode("save_assets", this.saveAssetsNode.bind(this));

    workflow.addEdge(START as any, "generate_story");
    workflow.addEdge("generate_story" as any, "generate_images");
    workflow.addEdge("generate_images" as any, "save_story");
    workflow.addEdge("save_story" as any, "generate_exercises");
    workflow.addEdge("generate_exercises" as any, "save_assets");
    workflow.addEdge("save_assets" as any, END);

    return workflow.compile();
  }

  private async generateStoryNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log(`[Workflow] Generating story for level ${state.level}, theme: ${state.theme || 'auto'}`);
      
      const result = await this.orchestrator.generateStoryWithExercises({
        level: state.level,
        theme: state.theme || "daily life",
        locale: "es-ES",
      });

      return {
        storyContent: {
          title: result.story.title,
          pages: result.story.pages,
          vocabulary: result.story.vocabulary || [],
          grammar: result.story.grammarFocus || [],
          content: result.story.pages.map((p: any) => p.text).join(' '),
        },
        storyPages: result.story.pages,
        exercises: result.exercises || [],
      };
    } catch (error) {
      console.error("[Workflow] Story generation failed:", error);
      return { error: "Failed to generate story" };
    }
  }

  private async generateImagesNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      if (!state.storyPages || state.storyPages.length === 0) {
        console.log("[Workflow] No pages to generate images for");
        return { imageUrls: [] };
      }

      console.log(`[Workflow] Generating ${state.storyPages.length} images for story pages`);
      
      const imagePromises = state.storyPages.map(async (page: any, index: number) => {
        const imagePrompt = `Illustration for children's Spanish learning story: ${page.text}. Scene ${index + 1}`;
        const imageUrl = await this.orchestrator.generateImage(imagePrompt, "flat-illustration");
        return imageUrl;
      });

      const imageUrls = await Promise.all(imagePromises);
      
      const pagesWithImages = state.storyPages.map((page: any, index: number) => ({
        ...page,
        imageUrl: imageUrls[index] || "",
      }));

      console.log(`[Workflow] Generated ${imageUrls.filter(url => url).length} images successfully`);

      return {
        imageUrls: imageUrls.filter(url => url),
        storyPages: pagesWithImages,
      };
    } catch (error) {
      console.error("[Workflow] Image generation failed:", error);
      return { imageUrls: [] };
    }
  }

  private async saveStoryNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      if (!state.storyContent || !state.storyPages) {
        throw new Error("No story content to save");
      }

      console.log("[Workflow] Saving story to database");

      const [savedStory] = await db.insert(stories).values({
        title: state.storyContent.title,
        level: state.level,
        theme: state.theme || "daily life",
        pages: state.storyPages,
        aiMetadata: {
          vocabulary: state.storyContent.vocabulary || [],
          grammar: state.storyContent.grammar || [],
          generatedBy: "gpt-4",
          generatedAt: new Date().toISOString(),
        },
      }).returning();

      console.log(`[Workflow] Story saved with ID: ${savedStory.id}`);

      return {
        storyId: savedStory.id,
      };
    } catch (error) {
      console.error("[Workflow] Failed to save story:", error);
      return { error: "Failed to save story" };
    }
  }

  private async generateExercisesNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      if (!state.storyId || !state.exercises || state.exercises.length === 0) {
        console.log("[Workflow] No exercises to save - using pre-generated exercises from story node");
        if (!state.storyId) {
          throw new Error("No story ID for exercise generation");
        }
        return { exercisesGenerated: false };
      }

      console.log(`[Workflow] Saving ${state.exercises.length} exercises for story ${state.storyId}`);

      const exercisePromises = state.exercises.map(async (exercise: any) => {
        const [savedExercise] = await db.insert(exercises).values({
          storyId: state.storyId!,
          gameType: exercise.gameType || exercise.type || "multiple_choice",
          level: state.level,
          exerciseData: {
            question: exercise.question || exercise.payload?.question,
            options: exercise.options || exercise.payload?.options || [],
            words: exercise.words || exercise.payload?.words || [],
            sentence: exercise.sentence || exercise.payload?.sentence || "",
          },
          correctAnswer: exercise.correctAnswer || exercise.payload?.correct || "",
          hints: exercise.hints || exercise.payload?.hints || [],
          aiMetadata: {
            generatedBy: "gpt-4",
            generatedAt: new Date().toISOString(),
          },
        }).returning();

        return savedExercise;
      });

      await Promise.all(exercisePromises);

      console.log(`[Workflow] Saved ${state.exercises.length} exercises successfully`);

      return {
        exercisesGenerated: true,
      };
    } catch (error) {
      console.error("[Workflow] Exercise saving failed:", error);
      return { error: "Failed to save exercises" };
    }
  }

  private async saveAssetsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      if (!state.storyId || !state.imageUrls || state.imageUrls.length === 0) {
        console.log("[Workflow] No assets to save");
        return {};
      }

      console.log(`[Workflow] Saving ${state.imageUrls.length} image assets for story ${state.storyId}`);

      const assetPromises = state.imageUrls.map(async (url: string, index: number) => {
        await db.insert(assets).values({
          storyId: state.storyId!,
          type: "image",
          url: url,
          metadata: {
            pageIndex: index,
            generatedBy: "dall-e-3",
            generatedAt: new Date().toISOString(),
          },
        });
      });

      await Promise.all(assetPromises);

      console.log("[Workflow] Assets saved successfully");
      return {};
    } catch (error) {
      console.error("[Workflow] Failed to save assets:", error);
      return { error: "Failed to save assets" };
    }
  }

  async executeWorkflow(userId: string, level: number, theme?: string): Promise<any> {
    try {
      console.log(`[Workflow] Starting multimodal learning workflow for user ${userId}, level ${level}`);

      const initialState: WorkflowState = {
        userId,
        level,
        theme: theme || "daily life",
      };

      const result = await this.graph.invoke(initialState);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.storyId) {
        throw new Error("Story was not saved successfully - no story ID returned");
      }

      console.log(`[Workflow] Workflow completed successfully. Story ID: ${result.storyId}`);

      return {
        success: true,
        storyId: result.storyId,
        imageCount: result.imageUrls?.length || 0,
        exercisesGenerated: result.exercisesGenerated || false,
      };
    } catch (error) {
      console.error("[Workflow] Workflow execution failed:", error);
      throw new Error(`Multimodal workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const multimodalWorkflow = new MultimodalLearningWorkflow();
