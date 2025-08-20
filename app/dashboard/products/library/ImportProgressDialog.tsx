"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCancelImport, useImportProgress } from "@/app/hooks/use-category-templates";
import { useNavigationLock } from "@/app/hooks/use-navigation-lock";

interface ImportProgressDialogProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportProgressDialog({
  jobId,
  isOpen,
  onClose,
}: ImportProgressDialogProps) {
  const router = useRouter();
  const { data: progress, isLoading } = useImportProgress(jobId);
  const cancelImport = useCancelImport();
  const [showResults, setShowResults] = useState(false);

  // Lock navigation while importing
  const isImporting = progress?.status === "importing";
  useNavigationLock({
    enabled: isOpen && isImporting,
    message: "Import is in progress. Are you sure you want to leave?",
  });

  // Handle completion
  useEffect(() => {
    if (progress?.status === "completed" || progress?.status === "error") {
      setShowResults(true);
    }
  }, [progress?.status]);

  const handleClose = () => {
    if (progress?.status === "importing") {
      if (confirm("Import is in progress. Are you sure you want to cancel?")) {
        cancelImport.mutate(jobId);
        onClose();
      }
    } else {
      onClose();
      if (progress?.status === "completed") {
        router.push("/dashboard/products/categories");
      }
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel the import?")) {
      cancelImport.mutate(jobId);
    }
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return "calculating...";
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = () => {
    switch (progress?.status) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case "error":
      case "cancelled":
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (progress?.status) {
      case "completed":
        return "text-green-600";
      case "error":
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-900";
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {showResults ? "Import Results" : "Importing Template Items"}
                </DialogTitle>
                {progress?.status !== "importing" && progress?.status !== "preparing" && (
                  <button
                    onClick={handleClose}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                )}
              </div>

              {isLoading && !progress ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : progress ? (
                <>
                  {!showResults ? (
                    <>
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{progress.percentage}%</span>
                          <span>
                            {progress.completedItems} of {progress.totalItems} items
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress.percentage}%` }}
                          >
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Current Item */}
                      {progress.currentItem && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-3" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">Currently importing:</p>
                              <p className="text-sm font-medium text-gray-900">
                                {progress.currentItem}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Time Estimate */}
                      <div className="text-sm text-gray-600 mb-4">
                        Estimated time remaining: {formatTime(progress.estimatedTimeRemaining)}
                      </div>

                      {/* Errors during import */}
                      {progress.errors.length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-start">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                {progress.errors.length} error{progress.errors.length !== 1 ? "s" : ""} occurred
                              </p>
                              <ul className="mt-1 text-xs text-yellow-700">
                                {progress.errors.slice(0, 3).map((error, index) => (
                                  <li key={index}>• {error.item}: {error.error}</li>
                                ))}
                                {progress.errors.length > 3 && (
                                  <li>• ...and {progress.errors.length - 3} more</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Warning */}
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-500">
                          ⚠️ Please don&apos;t close this window while importing
                        </p>
                      </div>

                      {/* Cancel Button */}
                      {(progress.status === "importing" || progress.status === "preparing") && (
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={handleCancel}
                            disabled={cancelImport.isPending}
                            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                          >
                            Cancel Import
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Import Results */}
                      <div className="space-y-4">
                        {/* Status */}
                        <div className="flex items-center justify-center">
                          {getStatusIcon()}
                          <span className={`ml-2 text-lg font-medium ${getStatusColor()}`}>
                            {progress.status === "completed" && "Import Completed Successfully"}
                            {progress.status === "error" && "Import Failed"}
                            {progress.status === "cancelled" && "Import Cancelled"}
                          </span>
                        </div>

                        {/* Summary */}
                        {progress.result && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              {progress.result.categoriesCreated > 0 && (
                                <div>✓ {progress.result.categoriesCreated} categories created</div>
                              )}
                              {progress.result.subcategoriesCreated > 0 && (
                                <div>✓ {progress.result.subcategoriesCreated} subcategories created</div>
                              )}
                              {progress.result.featuresCreated > 0 && (
                                <div>✓ {progress.result.featuresCreated} features created</div>
                              )}
                              {progress.result.categoriesSkipped > 0 && (
                                <div className="text-yellow-600">
                                  ⚠ {progress.result.categoriesSkipped} categories skipped (already exist)
                                </div>
                              )}
                              {progress.result.subcategoriesSkipped > 0 && (
                                <div className="text-yellow-600">
                                  ⚠ {progress.result.subcategoriesSkipped} subcategories skipped (already exist)
                                </div>
                              )}
                              {progress.result.featuresSkipped > 0 && (
                                <div className="text-yellow-600">
                                  ⚠ {progress.result.featuresSkipped} features skipped (already exist)
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Errors */}
                        {progress.errors.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-red-900 mb-2">
                              Errors ({progress.errors.length})
                            </h4>
                            <div className="max-h-32 overflow-y-auto">
                              <ul className="space-y-1 text-xs text-red-700">
                                {progress.errors.map((error, index) => (
                                  <li key={index}>
                                    • {error.item} ({error.itemType}): {error.error}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                          {progress.status === "completed" && (
                            <button
                              onClick={() => {
                                onClose();
                                router.push("/dashboard/products/categories");
                              }}
                              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                              View Categories
                            </button>
                          )}
                          <button
                            onClick={handleClose}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Import job not found</p>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}