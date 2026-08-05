/**
 * Supabase Storage Integration for 3D Model Uploads
 * Supports VRM, GLB, FBX, OBJ file formats
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supported 3D model file types
export const SUPPORTED_MODEL_TYPES = [
  'model/gltf-binary', // GLB
  'model/gltf+json', // GLTF
  'application/octet-stream', // VRM, FBX, OBJ (generic binary)
] as const;

export const SUPPORTED_EXTENSIONS = ['.vrm', '.glb', '.gltf', '.fbx', '.obj'] as const;

// Max file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Storage bucket name
const BUCKET_NAME = '3d-models';

// Get Supabase client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_PROJECT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  supabaseClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Initialize the storage bucket if it doesn't exist
 */
export async function initializeStorageBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets?.some((b: { name: string }) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [...SUPPORTED_MODEL_TYPES],
      });

      if (createError) {
        return { success: false, error: createError.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Validate file extension
 */
export function isValidModelFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number]);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf('.'));
}

/**
 * Upload a 3D model file to Supabase storage
 */
export async function uploadModel(params: {
  file: Buffer | Uint8Array;
  filename: string;
  userId: string;
  contentType?: string;
}): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}> {
  try {
    const { file, filename, userId, contentType } = params;

    // Validate file extension
    if (!isValidModelFile(filename)) {
      return {
        success: false,
        error: `Invalid file type. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      };
    }

    // Validate file size
    if (file.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    const supabase = getSupabaseClient();

    // Generate unique file path
    const timestamp = Date.now();
    const ext = getFileExtension(filename);
    const sanitizedName = filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(0, 50);
    const filePath = `${userId}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a 3D model file from Supabase storage
 */
export async function deleteModel(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * List all models for a user
 */
export async function listUserModels(userId: string): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    path: string;
    size: number;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const files = data?.map((file: { name: string; metadata?: { size?: number }; created_at?: string }) => ({
      name: file.name,
      path: `${userId}/${file.name}`,
      size: file.metadata?.size || 0,
      createdAt: file.created_at || new Date().toISOString(),
    })) || [];

    return { success: true, files };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get model file info
 */
export async function getModelInfo(filePath: string): Promise<{
  success: boolean;
  info?: {
    name: string;
    size: number;
    contentType: string;
    createdAt: string;
    publicUrl: string;
  };
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();

    // Get file metadata by listing the directory
    const parts = filePath.split('/');
    const filename = parts.pop() || '';
    const directory = parts.join('/');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(directory, {
        search: filename,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const file = data?.find((f: { name: string }) => f.name === filename);
    if (!file) {
      return { success: false, error: 'File not found' };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      info: {
        name: file.name,
        size: file.metadata?.size || 0,
        contentType: file.metadata?.mimetype || 'application/octet-stream',
        createdAt: file.created_at || new Date().toISOString(),
        publicUrl: urlData.publicUrl,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
