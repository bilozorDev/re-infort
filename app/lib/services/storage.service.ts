import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface UploadProgress {
  fileName: string;
  progress: number;
  url?: string;
  error?: string;
}

export async function uploadProductImage(
  supabase: SupabaseClient,
  file: File,
  organizationId: string,
  productId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string }> {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 5MB");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and AVIF images are allowed");
  }

  // Generate unique filename
  const timestamp = Date.now();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${organizationId}/${productId}/${fileName}`;

  // Upload file with progress tracking
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Report completion
  onProgress?.(100);

  return {
    url: filePath,
    path: data.path,
  };
}

export async function deleteProductImage(
  supabase: SupabaseClient,
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function getSignedUrls(
  supabase: SupabaseClient,
  filePaths: string[],
  expiresIn: number = 3600
): Promise<string[]> {
  const promises = filePaths.map(async (path) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error(`Failed to get signed URL for ${path}:`, error);
      return null;
    }
    
    return data.signedUrl;
  });

  const results = await Promise.all(promises);
  return results.filter((url): url is string => url !== null);
}

export async function downloadImage(
  supabase: SupabaseClient,
  filePath: string
): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return data;
}

// Utility function to validate images before upload
export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, WebP, and AVIF images are allowed" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  return { valid: true };
}

// Cleanup orphaned images (images that are no longer referenced by any product)
export async function cleanupOrphanedImages(
  supabase: SupabaseClient,
  organizationId: string,
  activeImagePaths: string[]
): Promise<void> {
  // List all files in the organization's folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(organizationId, {
      limit: 1000,
      offset: 0,
    });

  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }

  if (!files || files.length === 0) {
    return;
  }

  // Find orphaned files
  const activePathSet = new Set(activeImagePaths);
  const orphanedFiles = files
    .map((file) => `${organizationId}/${file.name}`)
    .filter((path) => !activePathSet.has(path));

  if (orphanedFiles.length === 0) {
    return;
  }

  // Delete orphaned files
  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(orphanedFiles);

  if (deleteError) {
    console.error("Error deleting orphaned files:", deleteError);
  }
}