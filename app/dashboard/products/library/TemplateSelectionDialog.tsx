"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback,useMemo, useState } from "react";
import { toast } from "sonner";

import { useCategoryTemplate, useImportTemplate } from "@/app/hooks/use-category-templates";
import type {
  ImportTemplateRequest,
  TemplateCategoryWithSubcategories,
  TemplateSubcategoryWithFeatures,
} from "@/app/types/category-template";

interface TemplateSelectionDialogProps {
  templateId: string;
  templateName: string;
  isOpen: boolean;
  onClose: () => void;
  onImportStart: (jobId: string) => void;
}

interface SelectionState {
  categories: Set<string>;
  subcategories: Set<string>;
  features: Set<string>;
}

export default function TemplateSelectionDialog({
  templateId,
  templateName,
  isOpen,
  onClose,
  onImportStart,
}: TemplateSelectionDialogProps) {
  const { data, isLoading } = useCategoryTemplate(templateId);
  const importTemplate = useImportTemplate();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<SelectionState>({
    categories: new Set(),
    subcategories: new Set(),
    features: new Set(),
  });

  const template = data?.template;

  // Calculate selection counts
  const selectionCounts = useMemo(() => {
    let categoriesCount = 0;
    let subcategoriesCount = 0;
    let featuresCount = 0;

    if (template) {
      template.categories.forEach((category) => {
        if (selection.categories.has(category.id)) {
          categoriesCount++;
        }
        
        category.subcategories.forEach((subcategory) => {
          if (selection.subcategories.has(subcategory.id)) {
            subcategoriesCount++;
          }
        });

        // Count features from both categories and subcategories
        category.features.forEach((feature) => {
          if (selection.features.has(feature.id)) {
            featuresCount++;
          }
        });

        category.subcategories.forEach((subcategory) => {
          subcategory.features.forEach((feature) => {
            if (selection.features.has(feature.id)) {
              featuresCount++;
            }
          });
        });
      });
    }

    return { categoriesCount, subcategoriesCount, featuresCount };
  }, [template, selection]);

  const toggleCategory = useCallback((categoryId: string, category: TemplateCategoryWithSubcategories) => {
    setSelection((prev) => {
      const newSelection = {
        categories: new Set(prev.categories),
        subcategories: new Set(prev.subcategories),
        features: new Set(prev.features),
      };

      if (prev.categories.has(categoryId)) {
        // Deselect category and all its children
        newSelection.categories.delete(categoryId);
        
        // Remove all subcategories
        category.subcategories.forEach((sub) => {
          newSelection.subcategories.delete(sub.id);
          // Remove subcategory features
          sub.features.forEach((f) => newSelection.features.delete(f.id));
        });
        
        // Remove category features
        category.features.forEach((f) => newSelection.features.delete(f.id));
      } else {
        // Select category and all its children
        newSelection.categories.add(categoryId);
        
        // Add all subcategories
        category.subcategories.forEach((sub) => {
          newSelection.subcategories.add(sub.id);
          // Add subcategory features
          sub.features.forEach((f) => newSelection.features.add(f.id));
        });
        
        // Add category features
        category.features.forEach((f) => newSelection.features.add(f.id));
      }

      return newSelection;
    });
  }, []);

  const toggleSubcategory = useCallback((subcategoryId: string, subcategory: TemplateSubcategoryWithFeatures, categoryId: string) => {
    setSelection((prev) => {
      const newSelection = {
        categories: new Set(prev.categories),
        subcategories: new Set(prev.subcategories),
        features: new Set(prev.features),
      };

      if (prev.subcategories.has(subcategoryId)) {
        // Deselect subcategory and its features
        newSelection.subcategories.delete(subcategoryId);
        subcategory.features.forEach((f) => newSelection.features.delete(f.id));
        
        // Check if we should deselect the parent category
        const category = template?.categories.find(c => c.id === categoryId);
        if (category) {
          const hasSelectedSubcategories = category.subcategories.some(
            (sub) => sub.id !== subcategoryId && newSelection.subcategories.has(sub.id)
          );
          const hasSelectedCategoryFeatures = category.features.some(
            (f) => newSelection.features.has(f.id)
          );
          
          if (!hasSelectedSubcategories && !hasSelectedCategoryFeatures) {
            newSelection.categories.delete(categoryId);
          }
        }
      } else {
        // Select subcategory and its features
        newSelection.subcategories.add(subcategoryId);
        subcategory.features.forEach((f) => newSelection.features.add(f.id));
        
        // Also select the parent category if not already selected
        newSelection.categories.add(categoryId);
      }

      return newSelection;
    });
  }, [template]);

  const toggleFeature = useCallback((featureId: string, parentId: string, parentType: "category" | "subcategory") => {
    setSelection((prev) => {
      const newSelection = {
        categories: new Set(prev.categories),
        subcategories: new Set(prev.subcategories),
        features: new Set(prev.features),
      };

      if (prev.features.has(featureId)) {
        newSelection.features.delete(featureId);
        
        // Check if we should deselect the parent
        if (parentType === "subcategory") {
          const subcategory = template?.categories
            .flatMap(c => c.subcategories)
            .find(s => s.id === parentId);
          
          if (subcategory) {
            const hasSelectedFeatures = subcategory.features.some(
              (f) => f.id !== featureId && newSelection.features.has(f.id)
            );
            
            if (!hasSelectedFeatures) {
              newSelection.subcategories.delete(parentId);
              
              // Check parent category
              const category = template?.categories.find(c => 
                c.subcategories.some(s => s.id === parentId)
              );
              
              if (category) {
                const hasSelectedSubcategories = category.subcategories.some(
                  (sub) => newSelection.subcategories.has(sub.id)
                );
                const hasSelectedCategoryFeatures = category.features.some(
                  (f) => newSelection.features.has(f.id)
                );
                
                if (!hasSelectedSubcategories && !hasSelectedCategoryFeatures) {
                  newSelection.categories.delete(category.id);
                }
              }
            }
          }
        } else {
          // It's a category feature
          const category = template?.categories.find(c => c.id === parentId);
          
          if (category) {
            const hasSelectedFeatures = category.features.some(
              (f) => f.id !== featureId && newSelection.features.has(f.id)
            );
            const hasSelectedSubcategories = category.subcategories.some(
              (sub) => newSelection.subcategories.has(sub.id)
            );
            
            if (!hasSelectedFeatures && !hasSelectedSubcategories) {
              newSelection.categories.delete(parentId);
            }
          }
        }
      } else {
        newSelection.features.add(featureId);
        
        // Also select the parent
        if (parentType === "subcategory") {
          newSelection.subcategories.add(parentId);
          // Find and select the parent category
          const category = template?.categories.find(c => 
            c.subcategories.some(s => s.id === parentId)
          );
          if (category) {
            newSelection.categories.add(category.id);
          }
        } else {
          newSelection.categories.add(parentId);
        }
      }

      return newSelection;
    });
  }, [template]);

  const selectAll = useCallback(() => {
    if (!template) return;
    
    const newSelection: SelectionState = {
      categories: new Set(),
      subcategories: new Set(),
      features: new Set(),
    };

    template.categories.forEach((category) => {
      newSelection.categories.add(category.id);
      category.features.forEach((f) => newSelection.features.add(f.id));
      
      category.subcategories.forEach((subcategory) => {
        newSelection.subcategories.add(subcategory.id);
        subcategory.features.forEach((f) => newSelection.features.add(f.id));
      });
    });

    setSelection(newSelection);
  }, [template]);

  const deselectAll = useCallback(() => {
    setSelection({
      categories: new Set(),
      subcategories: new Set(),
      features: new Set(),
    });
  }, []);

  const handleImport = async () => {
    if (selection.categories.size === 0) {
      toast.error("Please select at least one category to import");
      return;
    }

    // Build the import request
    const importRequest: Omit<ImportTemplateRequest, "templateId"> = {
      importMode: "merge",
      selections: {
        categories: [],
      },
    };

    template?.categories.forEach((category) => {
      if (selection.categories.has(category.id)) {
        const categorySelection = {
          templateCategoryId: category.id,
          includeFeatures: category.features.some((f) => selection.features.has(f.id)),
          subcategories: [] as Array<{
            templateSubcategoryId: string;
            includeFeatures: boolean;
            featureIds?: string[];
          }>,
          featureIds: category.features
            .filter((f) => selection.features.has(f.id))
            .map((f) => f.id),
        };

        category.subcategories.forEach((subcategory) => {
          if (selection.subcategories.has(subcategory.id)) {
            categorySelection.subcategories.push({
              templateSubcategoryId: subcategory.id,
              includeFeatures: subcategory.features.some((f) => selection.features.has(f.id)),
              featureIds: subcategory.features
                .filter((f) => selection.features.has(f.id))
                .map((f) => f.id),
            });
          }
        });

        importRequest.selections.categories.push(categorySelection);
      }
    });

    try {
      const result = await importTemplate.mutateAsync({
        templateId,
        request: importRequest,
      });
      
      onImportStart(result.jobId);
    } catch {
      // Error is handled by the mutation
    }
  };

  const isPartiallySelected = (category: TemplateCategoryWithSubcategories) => {
    const allSubcategoriesSelected = category.subcategories.every((sub) =>
      selection.subcategories.has(sub.id)
    );
    const someSubcategoriesSelected = category.subcategories.some((sub) =>
      selection.subcategories.has(sub.id)
    );
    const allCategoryFeaturesSelected = category.features.every((f) =>
      selection.features.has(f.id)
    );
    const someCategoryFeaturesSelected = category.features.some((f) =>
      selection.features.has(f.id)
    );

    return (
      (someSubcategoriesSelected && !allSubcategoriesSelected) ||
      (someCategoryFeaturesSelected && !allCategoryFeaturesSelected) ||
      (category.subcategories.some((sub) => isSubcategoryPartiallySelected(sub)))
    );
  };

  const isSubcategoryPartiallySelected = (subcategory: TemplateSubcategoryWithFeatures) => {
    const allFeaturesSelected = subcategory.features.every((f) =>
      selection.features.has(f.id)
    );
    const someFeaturesSelected = subcategory.features.some((f) =>
      selection.features.has(f.id)
    );

    return someFeaturesSelected && !allFeaturesSelected;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Import from {templateName}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                </div>
              ) : template ? (
                <>
                  {/* Selection Summary */}
                  <div className="mb-4 rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Selected: {selectionCounts.categoriesCount} categories,{" "}
                        {selectionCounts.subcategoriesCount} subcategories,{" "}
                        {selectionCounts.featuresCount} features
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAll}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={deselectAll}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tree View */}
                  <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                    {template.categories.map((category) => (
                      <div key={category.id} className="mb-4">
                        {/* Category */}
                        <div className="flex items-start">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedCategories);
                              if (expandedCategories.has(category.id)) {
                                newExpanded.delete(category.id);
                              } else {
                                newExpanded.add(category.id);
                              }
                              setExpandedCategories(newExpanded);
                            }}
                            className="mr-1 p-1"
                          >
                            {expandedCategories.has(category.id) ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          
                          <input
                            type="checkbox"
                            checked={selection.categories.has(category.id)}
                            onChange={() => toggleCategory(category.id, category)}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            ref={(input) => {
                              if (input) {
                                input.indeterminate = isPartiallySelected(category);
                              }
                            }}
                          />
                          
                          <div className="flex-1">
                            <label className="font-medium text-gray-900">
                              {category.name}
                            </label>
                            {category.description && (
                              <p className="text-xs text-gray-500">{category.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Category Features & Subcategories */}
                        {expandedCategories.has(category.id) && (
                          <div className="ml-7 mt-2">
                            {/* Category Features */}
                            {category.features.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Category Features:
                                </div>
                                {category.features.map((feature) => (
                                  <div key={feature.id} className="flex items-center ml-4 mb-1">
                                    <input
                                      type="checkbox"
                                      checked={selection.features.has(feature.id)}
                                      onChange={() => toggleFeature(feature.id, category.id, "category")}
                                      className="mr-2 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <label className="text-sm text-gray-700">
                                      {feature.name}
                                      {feature.is_required && (
                                        <span className="ml-1 text-xs text-red-500">*</span>
                                      )}
                                      {feature.unit && (
                                        <span className="ml-1 text-xs text-gray-400">({feature.unit})</span>
                                      )}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Subcategories */}
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="mb-3">
                                <div className="flex items-start">
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedSubcategories);
                                      if (expandedSubcategories.has(subcategory.id)) {
                                        newExpanded.delete(subcategory.id);
                                      } else {
                                        newExpanded.add(subcategory.id);
                                      }
                                      setExpandedSubcategories(newExpanded);
                                    }}
                                    className="mr-1 p-1"
                                  >
                                    {expandedSubcategories.has(subcategory.id) ? (
                                      <ChevronDownIcon className="h-3 w-3 text-gray-400" />
                                    ) : (
                                      <ChevronRightIcon className="h-3 w-3 text-gray-400" />
                                    )}
                                  </button>
                                  
                                  <input
                                    type="checkbox"
                                    checked={selection.subcategories.has(subcategory.id)}
                                    onChange={() => toggleSubcategory(subcategory.id, subcategory, category.id)}
                                    className="mr-2 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    ref={(input) => {
                                      if (input) {
                                        input.indeterminate = isSubcategoryPartiallySelected(subcategory);
                                      }
                                    }}
                                  />
                                  
                                  <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700">
                                      {subcategory.name}
                                    </label>
                                    {subcategory.description && (
                                      <p className="text-xs text-gray-500">{subcategory.description}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Subcategory Features */}
                                {expandedSubcategories.has(subcategory.id) && subcategory.features.length > 0 && (
                                  <div className="ml-7 mt-1">
                                    {subcategory.features.map((feature) => (
                                      <div key={feature.id} className="flex items-center ml-4 mb-1">
                                        <input
                                          type="checkbox"
                                          checked={selection.features.has(feature.id)}
                                          onChange={() => toggleFeature(feature.id, subcategory.id, "subcategory")}
                                          className="mr-2 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <label className="text-xs text-gray-600">
                                          {feature.name}
                                          {feature.is_required && (
                                            <span className="ml-1 text-xs text-red-500">*</span>
                                          )}
                                          {feature.unit && (
                                            <span className="ml-1 text-xs text-gray-400">({feature.unit})</span>
                                          )}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center justify-end gap-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm font-semibold text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={selection.categories.size === 0 || importTemplate.isPending}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importTemplate.isPending ? "Starting Import..." : `Import Selected Items`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Template not found</p>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}