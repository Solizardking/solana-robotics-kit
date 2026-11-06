/**
 * FAL AI Image-to-3D Generation Service
 * Supports Seed3D and Hunyuan3D-v3 models for converting images to 3D models
 */

import { fal } from "@fal-ai/client";

// Configure FAL client with API key
fal.config({
  credentials: process.env.FAL_API_KEY,
});

// Model endpoints
export const FAL_MODELS = {
  SEED3D: "fal-ai/bytedance/seed3d/image-to-3d",
  HUNYUAN3D_V3: "fal-ai/hunyuan3d-v3/image-to-3d",
} as const;

export type FalModel = keyof typeof FAL_MODELS;

// Generation types for Hunyuan3D
export type GenerateType = "Normal" | "LowPoly" | "Geometry";
export type PolygonType = "triangle" | "quadrilateral";

// Input types
export interface Seed3DInput {
  image_url: string;
}

export interface Hunyuan3DInput {
  input_image_url: string;
  back_image_url?: string;
  left_image_url?: string;
  right_image_url?: string;
  enable_pbr?: boolean;
  face_count?: number; // 40000-1500000, default 500000
  generate_type?: GenerateType;
  polygon_type?: PolygonType;
}

// Output types
export interface FalFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

export interface Seed3DOutput {
  model: FalFile;
  usage_tokens: number;
}

export interface ModelUrls {
  glb?: FalFile;
  fbx?: FalFile;
  obj?: FalFile;
  usdz?: FalFile;
}

export interface Hunyuan3DOutput {
  model_glb: FalFile;
  thumbnail: FalFile;
  model_urls: ModelUrls;
  seed: number;
}

// Generation status
export interface GenerationStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  logs?: string[];
  progress?: number;
}

// Generation result
export interface GenerationResult<T> {
  data: T;
  requestId: string;
}

/**
 * Generate 3D model from image using Seed3D
 * Returns a ZIP file containing the 3D model
 */
export async function generateSeed3D(
  imageUrl: string,
  onProgress?: (status: GenerationStatus) => void
): Promise<GenerationResult<Seed3DOutput>> {
  const logs: string[] = [];
  
  const result = await fal.subscribe(FAL_MODELS.SEED3D, {
    input: {
      image_url: imageUrl,
    } as Seed3DInput,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        const newLogs = update.logs.map((log) => log.message);
        logs.push(...newLogs);
        onProgress?.({
          status: "IN_PROGRESS",
          logs: newLogs,
        });
      } else if (update.status === "IN_QUEUE") {
        onProgress?.({
          status: "IN_QUEUE",
          logs: ["Waiting in queue..."],
        });
      }
    },
  });

  return {
    data: result.data as Seed3DOutput,
    requestId: result.requestId,
  };
}

/**
 * Generate 3D model from image using Hunyuan3D-v3
 * Returns GLB, OBJ, and other format files
 */
export async function generateHunyuan3D(
  input: Hunyuan3DInput,
  onProgress?: (status: GenerationStatus) => void
): Promise<GenerationResult<Hunyuan3DOutput>> {
  const logs: string[] = [];
  
  // Set defaults
  const inputWithDefaults: Hunyuan3DInput = {
    face_count: 500000,
    generate_type: "Normal",
    polygon_type: "triangle",
    ...input,
  };

  const result = await fal.subscribe(FAL_MODELS.HUNYUAN3D_V3, {
    input: inputWithDefaults,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        const newLogs = update.logs.map((log) => log.message);
        logs.push(...newLogs);
        onProgress?.({
          status: "IN_PROGRESS",
          logs: newLogs,
        });
      } else if (update.status === "IN_QUEUE") {
        onProgress?.({
          status: "IN_QUEUE",
          logs: ["Waiting in queue..."],
        });
      }
    },
  });

  return {
    data: result.data as Hunyuan3DOutput,
    requestId: result.requestId,
  };
}

/**
 * Submit a generation request without waiting (for async processing)
 */
export async function submitGeneration(
  model: FalModel,
  input: Seed3DInput | Hunyuan3DInput
): Promise<{ requestId: string }> {
  const endpoint = FAL_MODELS[model];
  
  const result = await fal.queue.submit(endpoint, {
    input,
  });

  return {
    requestId: result.request_id,
  };
}

/**
 * Check the status of a generation request
 */
export async function checkGenerationStatus(
  model: FalModel,
  requestId: string
): Promise<GenerationStatus> {
  const endpoint = FAL_MODELS[model];
  
  const status = await fal.queue.status(endpoint, {
    requestId,
    logs: true,
  });

  // Extract logs if available (type varies by status)
  const statusAny = status as { status: string; logs?: Array<{ message: string }> };
  
  return {
    status: statusAny.status as GenerationStatus["status"],
    logs: statusAny.logs?.map((log) => log.message),
  };
}

/**
 * Get the result of a completed generation
 */
export async function getGenerationResult<T extends Seed3DOutput | Hunyuan3DOutput>(
  model: FalModel,
  requestId: string
): Promise<T> {
  const endpoint = FAL_MODELS[model];
  
  const result = await fal.queue.result(endpoint, {
    requestId,
  });

  return result.data as T;
}

/**
 * Helper to determine which model to use based on requirements
 */
export function selectModel(options: {
  needsMultipleFormats?: boolean;
  needsPBR?: boolean;
  needsLowPoly?: boolean;
  preferQuality?: boolean;
}): FalModel {
  const { needsMultipleFormats, needsPBR, needsLowPoly, preferQuality } = options;
  
  // Hunyuan3D-v3 is better for:
  // - Multiple output formats (GLB, OBJ, FBX)
  // - PBR materials
  // - LowPoly generation
  // - Higher quality with configurable face count
  if (needsMultipleFormats || needsPBR || needsLowPoly || preferQuality) {
    return "HUNYUAN3D_V3";
  }
  
  // Seed3D is good for quick generation
  return "SEED3D";
}

/**
 * Unified generation function that handles both models
 */
export async function generateImageTo3D(
  imageUrl: string,
  options: {
    model?: FalModel;
    faceCount?: number;
    generateType?: GenerateType;
    polygonType?: PolygonType;
    enablePbr?: boolean;
    backImageUrl?: string;
    leftImageUrl?: string;
    rightImageUrl?: string;
  } = {},
  onProgress?: (status: GenerationStatus) => void
): Promise<{
  model: FalModel;
  requestId: string;
  glbUrl?: string;
  objUrl?: string;
  fbxUrl?: string;
  zipUrl?: string;
  thumbnailUrl?: string;
  seed?: number;
}> {
  const model = options.model || "HUNYUAN3D_V3";

  if (model === "SEED3D") {
    const result = await generateSeed3D(imageUrl, onProgress);
    return {
      model: "SEED3D",
      requestId: result.requestId,
      zipUrl: result.data.model.url,
    };
  } else {
    const result = await generateHunyuan3D(
      {
        input_image_url: imageUrl,
        face_count: options.faceCount,
        generate_type: options.generateType,
        polygon_type: options.polygonType,
        enable_pbr: options.enablePbr,
        back_image_url: options.backImageUrl,
        left_image_url: options.leftImageUrl,
        right_image_url: options.rightImageUrl,
      },
      onProgress
    );
    
    return {
      model: "HUNYUAN3D_V3",
      requestId: result.requestId,
      glbUrl: result.data.model_glb?.url,
      objUrl: result.data.model_urls?.obj?.url,
      fbxUrl: result.data.model_urls?.fbx?.url,
      thumbnailUrl: result.data.thumbnail?.url,
      seed: result.data.seed,
    };
  }
}
