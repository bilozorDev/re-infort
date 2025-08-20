"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { Checkbox, FormField, Select, TextField } from "@/app/components/ui/form";
import {
  useCreateFeatureDefinition,
  useDeleteFeatureDefinition,
  useFeatureDefinitions,
  useUpdateFeatureDefinition,
} from "@/app/hooks/use-features";
import type { FeatureDefinition, FeatureInputType } from "@/app/types/features";

interface FeatureDefinitionFormProps {
  categoryId?: string | null;
  subcategoryId?: string | null;
  categoryName?: string;
  subcategoryName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const inputTypeOptions = [
  { value: "text", label: "Text Input" },
  { value: "number", label: "Number Input" },
  { value: "select", label: "Dropdown Select" },
  { value: "boolean", label: "Yes/No Checkbox" },
  { value: "date", label: "Date Picker" },
];

export default function FeatureDefinitionForm({
  categoryId,
  subcategoryId,
  categoryName,
  subcategoryName,
  isOpen,
  onClose,
}: FeatureDefinitionFormProps) {
  const { data: features, isLoading } = useFeatureDefinitions(
    categoryId || undefined,
    subcategoryId || undefined
  );
  const createFeature = useCreateFeatureDefinition();
  const updateFeature = useUpdateFeatureDefinition();
  const deleteFeature = useDeleteFeatureDefinition();

  const [editingFeature, setEditingFeature] = useState<FeatureDefinition | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const form = useForm({
    defaultValues: {
      name: "",
      input_type: "text" as FeatureInputType,
      unit: "",
      is_required: false,
    },
    onSubmit: async ({ value }) => {
      try {
        if (editingFeature) {
          // For update, only send the fields that can be changed
          const updateData = {
            name: value.name,
            input_type: value.input_type,
            options: value.input_type === "select" && selectOptions.length > 0 ? selectOptions : null,
            unit: value.unit || null,
            is_required: value.is_required,
            // Keep the existing display_order
            display_order: editingFeature.display_order,
          };
          await updateFeature.mutateAsync({ id: editingFeature.id, data: updateData });
          setEditingFeature(null);
        } else {
          // For create, include all fields
          const createData = {
            ...value,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            options: value.input_type === "select" && selectOptions.length > 0 ? selectOptions : null,
            unit: value.unit || null,
            display_order: features?.length || 0,
          };
          await createFeature.mutateAsync(createData);
        }

        form.reset();
        setSelectOptions([]);
        setShowAddForm(false);
      } catch {
        // Error is handled by mutation hooks
      }
    },
  });

  const handleEdit = (feature: FeatureDefinition) => {
    setEditingFeature(feature);
    form.reset({
      name: feature.name,
      input_type: feature.input_type,
      unit: feature.unit || "",
      is_required: feature.is_required,
    });
    setSelectOptions(feature.options || []);
    setShowAddForm(true);
  };

  const handleDelete = async (feature: FeatureDefinition) => {
    if (confirm(`Are you sure you want to delete the "${feature.name}" feature?`)) {
      await deleteFeature.mutateAsync(feature.id);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim() && !selectOptions.includes(newOption.trim())) {
      setSelectOptions([...selectOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setSelectOptions(selectOptions.filter((_, i) => i !== index));
  };

  const isSubmitting = createFeature.isPending || updateFeature.isPending;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Manage Features for {subcategoryName || categoryName}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <>
                  {/* Existing Features List */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Existing Features</h3>
                    {features && features.length > 0 ? (
                      <div className="space-y-2">
                        {features.map((feature) => (
                          <div
                            key={feature.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{feature.name}</span>
                                {feature.is_required && (
                                  <span className="text-xs text-red-600">Required</span>
                                )}
                                <span className="text-xs text-gray-500">
                                  ({inputTypeOptions.find((opt) => opt.value === feature.input_type)?.label})
                                </span>
                                {feature.unit && (
                                  <span className="text-xs text-gray-500">Unit: {feature.unit}</span>
                                )}
                              </div>
                              {feature.options && feature.options.length > 0 && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Options: {feature.options.join(", ")}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(feature)}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(feature)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No features defined yet.</p>
                    )}
                  </div>

                  {/* Add/Edit Feature Form */}
                  {showAddForm ? (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        {editingFeature ? "Edit Feature" : "Add New Feature"}
                      </h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          form.handleSubmit();
                        }}
                        className="space-y-4"
                      >
                        <form.Field
                          name="name"
                          validators={{
                            onChange: ({ value }) =>
                              !value ? "Feature name is required" : undefined,
                          }}
                        >
                          {(field) => (
                            <FormField field={field}>
                              <TextField
                                label="Feature Name"
                                placeholder="e.g., CPU, RAM, Screen Size"
                                required
                              />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field name="input_type">
                          {(field) => (
                            <FormField field={field}>
                              <Select
                                label="Input Type"
                                options={inputTypeOptions}
                                required
                              />
                            </FormField>
                          )}
                        </form.Field>

                        {/* Options for Select Type */}
                        <form.Subscribe selector={(state) => state.values.input_type}>
                          {(inputType) =>
                            inputType === "select" && (
                              <div>
                                <label className="block text-sm/6 font-medium text-gray-900 mb-2">
                                  Dropdown Options
                                </label>
                                <div className="space-y-2">
                                  {selectOptions.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <span className="flex-1 px-3 py-1.5 bg-gray-50 rounded-md text-sm">
                                        {option}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newOption}
                                      onChange={(e) => setNewOption(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddOption();
                                        }
                                      }}
                                      placeholder="Add option..."
                                      className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleAddOption}
                                      className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                        </form.Subscribe>

                        <form.Field name="unit">
                          {(field) => (
                            <FormField field={field}>
                              <TextField
                                label="Unit (Optional)"
                                placeholder="e.g., GB, inches, MHz"
                              />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field name="is_required">
                          {(field) => (
                            <FormField field={field}>
                              <Checkbox label="Required field" />
                            </FormField>
                          )}
                        </form.Field>

                        <div className="flex items-center justify-end gap-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddForm(false);
                              setEditingFeature(null);
                              form.reset();
                              setSelectOptions([]);
                            }}
                            className="text-sm font-semibold text-gray-900"
                          >
                            Cancel
                          </button>
                          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                            {([canSubmit]) => (
                              <button
                                type="submit"
                                disabled={!canSubmit || isSubmitting}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmitting
                                  ? "Saving..."
                                  : editingFeature
                                  ? "Update Feature"
                                  : "Add Feature"}
                              </button>
                            )}
                          </form.Subscribe>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // Reset form for new feature
                        setEditingFeature(null);
                        form.reset({
                          name: "",
                          input_type: "text" as FeatureInputType,
                          unit: "",
                          is_required: false,
                        });
                        setSelectOptions([]);
                        setShowAddForm(true);
                      }}
                      className="w-full mt-4 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                    >
                      <PlusIcon className="h-4 w-4 inline mr-2" />
                      Add New Feature
                    </button>
                  )}
                </>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}