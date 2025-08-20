"use client";

import { CloudArrowUpIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PhotoIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";

import { useSupabase } from "@/app/hooks/use-supabase";
import {
  deleteProductImage,
  getSignedUrl,
  uploadProductImage,
  type UploadProgress,
  validateImage,
} from "@/app/lib/services/storage.service";

interface PhotoUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  organizationId: string;
  productId: string;
  maxPhotos?: number;
  disabled?: boolean;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onLightboxOpen?: (index: number) => void;
}

export function PhotoUpload({
  value = [],
  onChange,
  organizationId,
  productId,
  maxPhotos = 5,
  disabled = false,
  onUploadStart,
  onUploadComplete,
  onLightboxOpen,
}: PhotoUploadProps) {
  const supabase = useSupabase();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Load signed URLs for existing images
  useEffect(() => {
    const loadSignedUrls = async () => {
      const urls: Record<string, string> = {};
      for (const path of value) {
        try {
          const signedUrl = await getSignedUrl(supabase, path);
          urls[path] = signedUrl;
        } catch (error) {
          console.error(`Failed to load image ${path}:`, error);
        }
      }
      setPreviewUrls(urls);
    };

    if (value.length > 0) {
      loadSignedUrls();
    }
  }, [value, supabase]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const remainingSlots = maxPhotos - value.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      return;
    }

    // Validate all files first
    const validFiles: File[] = [];
    for (const file of filesToUpload) {
      const validation = validateImage(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        console.error(`Invalid file ${file.name}: ${validation.error}`);
        // You could show a toast notification here
      }
    }

    if (validFiles.length === 0) {
      return;
    }

    onUploadStart?.();

    const newProgress: Record<string, UploadProgress> = {};
    validFiles.forEach((file) => {
      newProgress[file.name] = {
        fileName: file.name,
        progress: 0,
      };
    });
    setUploadProgress(newProgress);

    const uploadedPaths: string[] = [];
    const newPreviewUrls: Record<string, string> = { ...previewUrls };

    for (const file of validFiles) {
      try {
        const { path } = await uploadProductImage(
          supabase,
          file,
          organizationId,
          productId,
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                progress,
              },
            }));
          }
        );

        uploadedPaths.push(path);
        
        // Get signed URL for preview
        const signedUrl = await getSignedUrl(supabase, path);
        newPreviewUrls[path] = signedUrl;

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 100,
            url: path,
          },
        }));
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            error: error instanceof Error ? error.message : "Upload failed",
          },
        }));
      }
    }

    // Update state
    setPreviewUrls(newPreviewUrls);
    onChange([...value, ...uploadedPaths]);

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress({});
    }, 2000);

    onUploadComplete?.();
  }, [maxPhotos, value, onUploadStart, onUploadComplete, onChange, previewUrls, supabase, organizationId, productId]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || value.length >= maxPhotos) {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      await handleFiles(files);
    },
    [disabled, value.length, maxPhotos, handleFiles]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) {
        return;
      }

      const files = Array.from(e.target.files);
      await handleFiles(files);
      
      // Reset input to allow selecting the same file again
      e.target.value = "";
    },
    [disabled, value.length, maxPhotos, handleFiles]
  );

  const handleDelete = async (index: number) => {
    if (disabled) return;

    const pathToDelete = value[index];
    
    try {
      await deleteProductImage(supabase, pathToDelete);
      
      // Remove from preview URLs
      const newPreviewUrls = { ...previewUrls };
      delete newPreviewUrls[pathToDelete];
      setPreviewUrls(newPreviewUrls);
      
      // Update value
      const newValue = value.filter((_, i) => i !== index);
      onChange(newValue);
    } catch (error) {
      console.error("Failed to delete image:", error);
      // You could show a toast notification here
    }
  };

  const isUploading = Object.keys(uploadProgress).length > 0;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-900">
        Product Photos
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({value.length}/{maxPhotos})
        </span>
      </label>

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((path, index) => (
            <div
              key={path}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              {previewUrls[path] ? (
                <img
                  src={previewUrls[path]}
                  alt={`Product ${index + 1}`}
                  className="h-full w-full object-cover cursor-pointer transition-transform hover:scale-105"
                  onClick={() => onLightboxOpen?.(index)}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              )}
              
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                  aria-label="Delete image"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{fileName}</span>
                {progress.error ? (
                  <span className="text-red-600">{progress.error}</span>
                ) : (
                  <span>{Math.round(progress.progress)}%</span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress.error ? "bg-red-600" : "bg-indigo-600"
                  }`}
                  style={{ width: `${progress.error ? 100 : progress.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag and Drop Area */}
      {value.length < maxPhotos && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-indigo-600 bg-indigo-50"
              : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <input
            type="file"
            id="photo-upload"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={disabled || isUploading}
            onChange={handleFileSelect}
          />
          
          <label
            htmlFor="photo-upload"
            className={`flex flex-col items-center ${
              disabled || isUploading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isDragging ? (
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-indigo-600" />
            ) : (
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            )}
            
            <p className="mt-2 text-sm text-gray-900">
              {isDragging ? (
                "Drop files here"
              ) : (
                <>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, WebP, AVIF up to 5MB each
            </p>
          </label>
        </div>
      )}
    </div>
  );
}