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
    workflow.addNode("parallel_processing", this.parallelProcessingNode.bind(this));
    workflow.addNode("save_assets", this.saveAssetsNode.bind(this));

    workflow.addEdge(START as any, "generate_story");
    workflow.addEdge("generate_story" as any, "parallel_processing");
    workflow.addEdge("parallel_processing" as any, "save_assets");
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
          vocabulary: [],
          grammar: [],
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

  private async parallelProcessingNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log(`[Workflow] Starting optimized processing with parallel image generation`);

      // Step 1: Generate all images in parallel (fastest part to parallelize)
      const imageUrls = await this.generateImagesParallel(state);
      
      // Validate that pages have imageUrl before saving
      const pagesWithImages = state.storyPages?.filter(p => p.imageUrl).length || 0;
      console.log(`[Workflow] Validation: ${pagesWithImages}/${state.storyPages?.length || 0} pages have images`);
      
      // Step 2: Save story with image URLs (now includes imageUrl fields)
      const storyId = await this.saveStoryToDb(state);

      // Step 3: Save exercises with the storyId
      await this.saveExercisesToDb(state, storyId);

      console.log(`[Workflow] Parallel processing completed. Story ID: ${storyId}`);

      return {
        storyId: storyId,
        imageUrls: imageUrls,
        exercisesGenerated: true,
      };
    } catch (error) {
      console.error("[Workflow] Parallel processing failed:", error);
      return { error: "Failed to process content" };
    }
  }

  private async generateImagesParallel(state: WorkflowState): Promise<string[]> {
    if (!state.storyPages || state.storyPages.length === 0) {
      console.log("[Workflow] No pages to generate images for");
      return [];
    }

    console.log(`[Workflow] Generating ${state.storyPages.length} images in parallel`);
    
    const imagePromises = state.storyPages.map(async (page: any, index: number) => {
      const imagePrompt = `Illustration for children's Spanish learning story: ${page.text}. Scene ${index + 1}`;
      return await this.orchestrator.generateImage(imagePrompt, "flat-illustration");
    });

    const imageUrls = await Promise.all(imagePromises);
    
    // Update story pages with image URLs
    state.storyPages = state.storyPages.map((page: any, index: number) => ({
      ...page,
      imageUrl: imageUrls[index] || "",
    }));

    console.log(`[Workflow] Generated ${imageUrls.filter(url => url).length} images successfully`);
    return imageUrls.filter(url => url);
  }

  private async saveStoryToDb(state: WorkflowState): Promise<string> {
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
    return savedStory.id;
  }

  private async saveExercisesToDb(state: WorkflowState, storyId: string): Promise<void> {
    if (!state.exercises || state.exercises.length === 0) {
      console.log("[Workflow] No exercises to save");
      return;
    }

    console.log(`[Workflow] Saving ${state.exercises.length} exercises for story ${storyId}`);

    const exercisePromises = state.exercises.map(async (exercise: any) => {
      return await db.insert(exercises).values({
        storyId: storyId,
        gameType: exercise.gameType || exercise.type || "multiple_choice",
        level: state.level,
        exerciseData: {
          question: exercise.question || exercise.exercise?.payload?.question || exercise.payload?.question,
          options: exercise.options || exercise.exercise?.payload?.options || exercise.payload?.options || [],
          words: exercise.words || exercise.exercise?.payload?.words || exercise.payload?.words || [],
          sentence: exercise.sentence || exercise.exercise?.payload?.sentence || exercise.payload?.sentence || "",
          choices: exercise.exercise?.payload?.choices || exercise.payload?.choices || [],
          correctIndex: exercise.exercise?.payload?.correctIndex ?? exercise.payload?.correctIndex,
          correct: exercise.exercise?.payload?.correct || exercise.payload?.correct || "",
        },
        correctAnswer: exercise.correctAnswer || exercise.exercise?.payload?.correct || exercise.payload?.correct || "",
        hints: exercise.hints || exercise.exercise?.payload?.hints || exercise.payload?.hints || [],
        aiMetadata: {
          generatedBy: "gpt-4",
          generatedAt: new Date().toISOString(),
        },
      }).returning();
    });

    await Promise.all(exercisePromises);
    console.log(`[Workflow] Saved ${state.exercises.length} exercises successfully`);
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
