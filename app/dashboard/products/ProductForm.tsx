"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, MinusIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { Fragment, useEffect, useState } from "react";

import { FormField, Select, TextArea, TextField } from "@/app/components/ui/form";
import { PhotoLightbox } from "@/app/components/ui/PhotoLightbox";
import { PhotoUpload } from "@/app/components/ui/PhotoUpload";
import {
  useCategories,
  useCreateCategory,
  useCreateSubcategory,
  useSubcategories,
} from "@/app/hooks/use-categories";
import { useFeatureDefinitions, useProductFeatures, useUpdateProductFeatures } from "@/app/hooks/use-features";
import { useCreateProduct, useProduct, useUpdateProduct } from "@/app/hooks/use-products";
import { useSupabase } from "@/app/hooks/use-supabase";
import { getSignedUrls } from "@/app/lib/services/storage.service";
import { createProductSchema } from "@/app/lib/validations/product";
import type { CreateProductFeatureInput } from "@/app/types/features";

interface ProductFormProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  organizationId: string;
}

export default function ProductForm({ productId, isOpen, onClose, isAdmin, organizationId }: ProductFormProps) {
  const { data: product, isLoading } = useProduct(productId || "");
  const { data: categories, isLoading: categoriesLoading } = useCategories(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategory = useCreateCategory();
  const createSubcategory = useCreateSubcategory();

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<string[]>([]);
  const [productFeatures, setProductFeatures] = useState<Record<string, string>>({});
  const [customFeatures, setCustomFeatures] = useState<Array<{ name: string; value: string }>>([]);
  const supabase = useSupabase();

  const form = useForm({
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      category_id: "",
      subcategory_id: "",
      cost: "",
      price: "",
      photo_urls: [] as string[],
      link: "",
      serial_number: "",
      status: "active" as "active" | "inactive" | "discontinued",
    },
    onSubmit: async ({ value }) => {
      try {
        const data = {
          ...value,
          cost: value.cost ? parseFloat(value.cost) : null,
          price: value.price ? parseFloat(value.price) : null,
          category_id: value.category_id || null,
          subcategory_id: value.subcategory_id || null,
          description: value.description || null,
          photo_urls: value.photo_urls?.length > 0 ? value.photo_urls : null,
          link: value.link || null,
          serial_number: value.serial_number || null,
        };

        const validatedData = createProductSchema.parse(data);

        let savedProductId = productId;
        
        if (productId) {
          await updateProduct.mutateAsync({ id: productId, data: validatedData });
        } else {
          const newProduct = await createProduct.mutateAsync(validatedData);
          savedProductId = newProduct.id;
        }
        
        // Save product features if any
        if (savedProductId) {
          const featuresToSave: CreateProductFeatureInput[] = [];
          
          // Add predefined features
          Object.entries(productFeatures).forEach(([definitionId, value]) => {
            if (value) {
              const definition = featureDefinitions?.find(d => d.id === definitionId);
              if (definition) {
                featuresToSave.push({
                  feature_definition_id: definitionId,
                  name: definition.name,
                  value,
                  is_custom: false,
                });
              }
            }
          });
          
          // Add custom features
          customFeatures.forEach((custom) => {
            if (custom.name && custom.value) {
              featuresToSave.push({
                name: custom.name,
                value: custom.value,
                is_custom: true,
              });
            }
          });
          
          if (featuresToSave.length > 0) {
            await updateProductFeatures.mutateAsync({
              productId: savedProductId,
              features: featuresToSave,
            });
          }
        }
        
        onClose();
      } catch {
        // Error is handled by mutation hooks and toast notifications
      }
    },
  });

  // Subscribe to category_id changes to trigger subcategory fetch
  const [currentCategoryId, setCurrentCategoryId] = useState<string>("");
  
  // Load signed URLs for photo lightbox
  useEffect(() => {
    const loadSignedUrls = async () => {
      const photoUrls = form.store.state.values.photo_urls;
      if (photoUrls && photoUrls.length > 0) {
        try {
          const urls = await getSignedUrls(supabase, photoUrls);
          setSignedPhotoUrls(urls);
        } catch (error) {
          console.error("Failed to load signed URLs:", error);
          setSignedPhotoUrls([]);
        }
      } else {
        setSignedPhotoUrls([]);
      }
    };
    
    loadSignedUrls();
  }, [form.store.state.values.photo_urls, supabase]);
  
  // Watch for category_id changes
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const categoryId = form.store.state.values.category_id;
      if (categoryId !== currentCategoryId) {
        setCurrentCategoryId(categoryId);
      }
    });
    return unsubscribe;
  }, [form.store, currentCategoryId]);

  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(currentCategoryId || null);
  
  // Get feature definitions for the selected category/subcategory
  const { data: featureDefinitions } = useFeatureDefinitions(
    currentCategoryId || undefined,
    form.store.state.values.subcategory_id || undefined
  );
  
  // Get existing product features if editing
  const { data: existingFeatures } = useProductFeatures(productId || "");
  const updateProductFeatures = useUpdateProductFeatures();

  // Update form when product data loads
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        category_id: product.category_id || "",
        subcategory_id: product.subcategory_id || "",
        cost: product.cost?.toString() || "",
        price: product.price?.toString() || "",
        photo_urls: product.photo_urls || [],
        link: product.link || "",
        serial_number: product.serial_number || "",
        status: product.status as "active" | "inactive" | "discontinued",
      });
      // Also update the current category ID for subcategory fetching
      setCurrentCategoryId(product.category_id || "");
    }
  }, [product, form]);
  
  // Load existing features when editing
  useEffect(() => {
    if (existingFeatures && existingFeatures.length > 0) {
      const predefinedFeatures: Record<string, string> = {};
      const customFeaturesList: Array<{ name: string; value: string }> = [];
      
      existingFeatures.forEach((feature) => {
        if (feature.is_custom) {
          customFeaturesList.push({ name: feature.name, value: feature.value });
        } else if (feature.feature_definition_id) {
          predefinedFeatures[feature.feature_definition_id] = feature.value;
        }
      });
      
      setProductFeatures(predefinedFeatures);
      setCustomFeatures(customFeaturesList);
    }
  }, [existingFeatures]);


  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
  ];

  const categoryOptions = categories?.map((cat) => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  const subcategoryOptions = subcategories?.map((sub) => ({
    value: sub.id,
    label: sub.name,
  })) || [];

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isAddingCategory) return;

    setIsAddingCategory(true);
    try {
      const category = await createCategory.mutateAsync({
        name: newCategoryName,
        status: "active",
      });
      form.setFieldValue("category_id", category.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch {
      // Error is handled by the mutation
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim() || !currentCategoryId || isAddingSubcategory) return;

    setIsAddingSubcategory(true);
    try {
      const subcategory = await createSubcategory.mutateAsync({
        name: newSubcategoryName,
        category_id: currentCategoryId,
        status: "active",
      });
      form.setFieldValue("subcategory_id", subcategory.id);
      setNewSubcategoryName("");
      setShowNewSubcategory(false);
    } catch {
      // Error is handled by the mutation
    } finally {
      setIsAddingSubcategory(false);
    }
  };

  const handleMarkupClick = (percentage: number) => {
    const cost = parseFloat(form.store.state.values.cost);
    if (cost > 0) {
      const price = cost * (1 + percentage / 100);
      form.setFieldValue("price", price.toFixed(2));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/25 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            {isLoading && productId ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-5">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                      {productId ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <button
                      onClick={onClose}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                    className="space-y-6"
                  >
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <form.Field
                        name="name"
                        validators={{
                          onChange: ({ value }) =>
                            !value ? "Product name is required" : undefined,
                        }}
                      >
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              label="Product Name"
                              placeholder="Enter product name"
                              required
                            />
                          </FormField>
                        )}
                      </form.Field>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <form.Field
                          name="sku"
                          validators={{
                            onChange: ({ value }) => (!value ? "SKU is required" : undefined),
                          }}
                        >
                          {(field) => (
                            <FormField field={field}>
                              <TextField label="SKU" placeholder="PRD-001" required />
                            </FormField>
                          )}
                        </form.Field>

                        <form.Field name="serial_number">
                          {(field) => (
                            <FormField field={field}>
                              <TextField label="Serial Number" placeholder="SN123456" />
                            </FormField>
                          )}
                        </form.Field>
                      </div>

                      {/* Category and Subcategory Selection */}
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        {/* Category Selector */}
                        <div>
                          <form.Field name="category_id">
                            {(field) => {
                              const selectedCategory = categoryOptions.find(cat => cat.value === field.state.value);
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <label className="block text-sm/6 font-medium text-gray-900">
                                        Category
                                      </label>
                                      <div className="mt-2">
                                        {categoriesLoading ? (
                                          <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                            <span className="text-sm text-gray-500">Loading categories...</span>
                                          </div>
                                        ) : (
                                          <Listbox
                                            value={field.state.value}
                                            onChange={(value) => {
                                              field.handleChange(value);
                                              // Clear subcategory when category changes
                                              if (value !== field.state.value) {
                                                form.setFieldValue("subcategory_id", "");
                                              }
                                            }}
                                          >
                                            <div className="relative">
                                              <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm/6">
                                                <span className="block truncate">
                                                  {selectedCategory ? selectedCategory.label : "Select a category"}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                              </ListboxButton>

                                              <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                              >
                                                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                                  <ListboxOption
                                                    value=""
                                                    className={({ focus }) =>
                                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        focus ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                      }`
                                                    }
                                                  >
                                                    {({ selected, focus }) => (
                                                      <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                          Select a category
                                                        </span>
                                                        {selected ? (
                                                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${focus ? 'text-white' : 'text-indigo-600'}`}>
                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                          </span>
                                                        ) : null}
                                                      </>
                                                    )}
                                                  </ListboxOption>
                                                  {categoryOptions.map((option) => (
                                                    <ListboxOption
                                                      key={option.value}
                                                      value={option.value}
                                                      className={({ focus }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                          focus ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                        }`
                                                      }
                                                    >
                                                      {({ selected, focus }) => (
                                                        <>
                                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {option.label}
                                                          </span>
                                                          {selected ? (
                                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${focus ? 'text-white' : 'text-indigo-600'}`}>
                                                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                          ) : null}
                                                        </>
                                                      )}
                                                    </ListboxOption>
                                                  ))}
                                                </ListboxOptions>
                                              </Transition>
                                            </div>
                                          </Listbox>
                                        )}
                                      </div>
                                    </div>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => setShowNewCategory(!showNewCategory)}
                                        className="ml-2 mt-8 p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
                                        title={showNewCategory ? "Cancel adding category" : "Add new category"}
                                      >
                                        {showNewCategory ? (
                                          <MinusIcon className="h-5 w-5" />
                                        ) : (
                                          <PlusIcon className="h-5 w-5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <Transition
                                    show={showNewCategory}
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                  >
                                    <div className="mt-2">
                                      <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleCreateCategory();
                                          }
                                          if (e.key === "Escape") {
                                            setShowNewCategory(false);
                                            setNewCategoryName("");
                                          }
                                        }}
                                        placeholder="Enter category name"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                        autoFocus
                                      />
                                    </div>
                                  </Transition>
                                </div>
                              );
                            }}
                          </form.Field>
                        </div>

                        {/* Subcategory Selector */}
                        <div>
                          <form.Field name="subcategory_id">
                            {(field) => {
                              const selectedSubcategory = subcategoryOptions.find(sub => sub.value === field.state.value);
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <label className="block text-sm/6 font-medium text-gray-900">
                                        Subcategory
                                      </label>
                                      <div className="mt-2">
                                        {subcategoriesLoading && currentCategoryId ? (
                                          <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                            <span className="text-sm text-gray-500">Loading subcategories...</span>
                                          </div>
                                        ) : (
                                          <Listbox
                                            value={field.state.value}
                                            onChange={(value) => field.handleChange(value)}
                                            disabled={!currentCategoryId || subcategoriesLoading}
                                          >
                                            <div className="relative">
                                              <ListboxButton 
                                                className={`relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm/6 ${
                                                  !currentCategoryId || subcategoriesLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                                disabled={!currentCategoryId || subcategoriesLoading}
                                              >
                                                <span className="block truncate">
                                                  {selectedSubcategory ? selectedSubcategory.label : 
                                                   currentCategoryId ? "Select a subcategory" : "Select a category first"}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                              </ListboxButton>

                                              <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                              >
                                                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                                  <ListboxOption
                                                    value=""
                                                    className={({ focus }) =>
                                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        focus ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                      }`
                                                    }
                                                  >
                                                    {({ selected, focus }) => (
                                                      <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                          Select a subcategory
                                                        </span>
                                                        {selected ? (
                                                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${focus ? 'text-white' : 'text-indigo-600'}`}>
                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                          </span>
                                                        ) : null}
                                                      </>
                                                    )}
                                                  </ListboxOption>
                                                  {subcategoryOptions.map((option) => (
                                                    <ListboxOption
                                                      key={option.value}
                                                      value={option.value}
                                                      className={({ focus }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                          focus ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                        }`
                                                      }
                                                    >
                                                      {({ selected, focus }) => (
                                                        <>
                                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {option.label}
                                                          </span>
                                                          {selected ? (
                                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${focus ? 'text-white' : 'text-indigo-600'}`}>
                                                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                          ) : null}
                                                        </>
                                                      )}
                                                    </ListboxOption>
                                                  ))}
                                                </ListboxOptions>
                                              </Transition>
                                            </div>
                                          </Listbox>
                                        )}
                                      </div>
                                    </div>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => setShowNewSubcategory(!showNewSubcategory)}
                                        disabled={!currentCategoryId}
                                        className="ml-2 mt-8 p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        title={currentCategoryId ? 
                                          (showNewSubcategory ? "Cancel adding subcategory" : "Add new subcategory") : 
                                          "Select a category first"}
                                      >
                                        {showNewSubcategory ? (
                                          <MinusIcon className="h-5 w-5" />
                                        ) : (
                                          <PlusIcon className="h-5 w-5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <Transition
                                    show={showNewSubcategory && !!currentCategoryId}
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                  >
                                    <div className="mt-2">
                                      <input
                                        type="text"
                                        value={newSubcategoryName}
                                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleCreateSubcategory();
                                          }
                                          if (e.key === "Escape") {
                                            setShowNewSubcategory(false);
                                            setNewSubcategoryName("");
                                          }
                                        }}
                                        placeholder="Enter subcategory name"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                        autoFocus
                                      />
                                    </div>
                                  </Transition>
                                </div>
                              );
                            }}
                          </form.Field>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <form.Field name="cost">
                          {(field) => (
                            <FormField field={field}>
                              <TextField
                                label="Cost"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                prefix="$"
                              />
                            </FormField>
                          )}
                        </form.Field>

                        <div>
                          <form.Field name="price">
                            {(field) => (
                              <FormField field={field}>
                                <TextField
                                  label="Price"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  prefix="$"
                                />
                              </FormField>
                            )}
                          </form.Field>
                          
                          {/* Markup Pills */}
                          <form.Subscribe selector={(state) => [state.values.cost, state.values.price]}>
                            {([cost, price]) => {
                              const costValue = parseFloat(cost);
                              const priceValue = parseFloat(price);
                              
                              // Calculate active markup
                              let currentActiveMarkup: number | null = null;
                              if (costValue > 0 && priceValue > 0) {
                                const markup = ((priceValue - costValue) / costValue) * 100;
                                if (Math.abs(markup - 10) < 0.01) {
                                  currentActiveMarkup = 10;
                                } else if (Math.abs(markup - 15) < 0.01) {
                                  currentActiveMarkup = 15;
                                } else if (Math.abs(markup - 20) < 0.01) {
                                  currentActiveMarkup = 20;
                                }
                              }
                              
                              return (
                                <div className="mt-2 flex gap-2">
                                  <span className="text-xs text-gray-500 mr-1 mt-1">Quick markup:</span>
                                  {[10, 15, 20].map((percentage) => {
                                    const isDisabled = !costValue || costValue <= 0;
                                    const isActive = currentActiveMarkup === percentage;
                                    
                                    return (
                                      <button
                                        key={percentage}
                                        type="button"
                                        onClick={() => handleMarkupClick(percentage)}
                                        disabled={isDisabled}
                                        className={`
                                          px-3 py-1 text-xs font-medium rounded-full transition-all duration-200
                                          ${isActive 
                                            ? 'bg-indigo-100 text-indigo-700' 
                                            : isDisabled
                                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                          }
                                        `}
                                      >
                                        {percentage}%
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            }}
                          </form.Subscribe>
                        </div>
                      </div>

                      {/* Description */}
                      <form.Field name="description">
                        {(field) => (
                          <FormField field={field}>
                            <TextArea
                              label="Description"
                              rows={3}
                              placeholder="Enter product description..."
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Dynamic Feature Fields */}
                      {featureDefinitions && featureDefinitions.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-900">Product Features</h3>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            {featureDefinitions.map((definition) => (
                              <div key={definition.id}>
                                <label className="block text-sm/6 font-medium text-gray-900">
                                  {definition.name}
                                  {definition.is_required && <span className="text-red-500 ml-1">*</span>}
                                  {definition.unit && <span className="text-gray-500 ml-1">({definition.unit})</span>}
                                </label>
                                <div className="mt-2">
                                  {definition.input_type === "select" && definition.options ? (
                                    <select
                                      value={productFeatures[definition.id] || ""}
                                      onChange={(e) => setProductFeatures({
                                        ...productFeatures,
                                        [definition.id]: e.target.value,
                                      })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                      required={definition.is_required}
                                    >
                                      <option value="">Select {definition.name}</option>
                                      {definition.options.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : definition.input_type === "boolean" ? (
                                    <input
                                      type="checkbox"
                                      checked={productFeatures[definition.id] === "true"}
                                      onChange={(e) => setProductFeatures({
                                        ...productFeatures,
                                        [definition.id]: e.target.checked ? "true" : "false",
                                      })}
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                  ) : definition.input_type === "number" ? (
                                    <input
                                      type="number"
                                      value={productFeatures[definition.id] || ""}
                                      onChange={(e) => setProductFeatures({
                                        ...productFeatures,
                                        [definition.id]: e.target.value,
                                      })}
                                      placeholder={`Enter ${definition.name.toLowerCase()}`}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                      required={definition.is_required}
                                    />
                                  ) : definition.input_type === "date" ? (
                                    <input
                                      type="date"
                                      value={productFeatures[definition.id] || ""}
                                      onChange={(e) => setProductFeatures({
                                        ...productFeatures,
                                        [definition.id]: e.target.value,
                                      })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                      required={definition.is_required}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={productFeatures[definition.id] || ""}
                                      onChange={(e) => setProductFeatures({
                                        ...productFeatures,
                                        [definition.id]: e.target.value,
                                      })}
                                      placeholder={`Enter ${definition.name.toLowerCase()}`}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                      required={definition.is_required}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Features */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">Custom Features</h3>
                          <button
                            type="button"
                            onClick={() => setCustomFeatures([...customFeatures, { name: "", value: "" }])}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            + Add Custom Feature
                          </button>
                        </div>
                        {customFeatures.length > 0 && (
                          <div className="space-y-3">
                            {customFeatures.map((feature, index) => (
                              <div key={index} className="flex gap-3">
                                <input
                                  type="text"
                                  value={feature.name}
                                  onChange={(e) => {
                                    const updated = [...customFeatures];
                                    updated[index].name = e.target.value;
                                    setCustomFeatures(updated);
                                  }}
                                  placeholder="Feature name"
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                                <input
                                  type="text"
                                  value={feature.value}
                                  onChange={(e) => {
                                    const updated = [...customFeatures];
                                    updated[index].value = e.target.value;
                                    setCustomFeatures(updated);
                                  }}
                                  placeholder="Feature value"
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = customFeatures.filter((_, i) => i !== index);
                                    setCustomFeatures(updated);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Photo Upload */}
                      <form.Field name="photo_urls">
                        {(field) => (
                          <PhotoUpload
                            value={field.state.value}
                            onChange={field.handleChange}
                            organizationId={organizationId}
                            productId={productId || `new-${Date.now()}`}
                            disabled={isSubmitting || isUploadingPhotos}
                            onUploadStart={() => setIsUploadingPhotos(true)}
                            onUploadComplete={() => setIsUploadingPhotos(false)}
                            onLightboxOpen={(index) => {
                              setLightboxIndex(index);
                              setLightboxOpen(true);
                            }}
                          />
                        )}
                      </form.Field>

                      {/* Product Link */}
                      <form.Field name="link">
                        {(field) => (
                          <FormField field={field}>
                            <TextField
                              label="Product Link"
                              type="url"
                              placeholder="https://example.com/product"
                            />
                          </FormField>
                        )}
                      </form.Field>

                      {/* Status */}
                      <form.Field name="status">
                        {(field) => (
                          <FormField field={field}>
                            <Select label="Status" options={statusOptions} required />
                          </FormField>
                        )}
                      </form.Field>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-sm font-semibold text-gray-900"
                      >
                        Cancel
                      </button>
                      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                        {([canSubmit]) => (
                          <button
                            type="submit"
                            disabled={!canSubmit || isSubmitting || isUploadingPhotos}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting
                              ? "Saving..."
                              : productId
                              ? "Update Product"
                              : "Create Product"}
                          </button>
                        )}
                      </form.Subscribe>
                    </div>
                  </form>
                </div>
              </>
            )}
          </DialogPanel>
        </div>
      </div>
      
      {/* Photo Lightbox */}
      {lightboxOpen && signedPhotoUrls.length > 0 && (
        <PhotoLightbox
          images={signedPhotoUrls}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </Dialog>
  );
}