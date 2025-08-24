"use client";

import { debounce } from "lodash";
import { Briefcase, Package, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import type { SearchResult } from "@/app/types/quotes-helpers";
import { formatCurrency } from "@/app/utils/formatters";

interface SelectedItem extends Partial<SearchResult> {
  type: "product" | "service" | "custom";
  warehouse_id?: string;
  warehouse_name?: string;
  available_quantity?: number;
}

interface ItemSearchProps {
  onSelectItem: (item: SelectedItem) => void;
  onCancel: () => void;
}

export default function ItemSearch({ onSelectItem, onCancel }: ItemSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"all" | "product" | "service">("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: "",
    description: "",
    price: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const performSearch = useCallback(
    debounce(async (query: string, type: string) => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          type: type,
          limit: "10",
        });
        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(searchTerm, searchType);
  }, [searchTerm, searchType, performSearch]);

  const handleSelectProduct = (product: SearchResult, warehouseId?: string) => {
    const selectedWarehouse = product.availability?.find(
      (w) => w.warehouse_id === warehouseId
    );

    onSelectItem({
      ...product,
      warehouse_id: warehouseId,
      warehouse_name: selectedWarehouse?.warehouse_name,
      available_quantity: selectedWarehouse?.available_quantity,
    });
  };

  const handleAddCustomItem = () => {
    if (!customItem.name || customItem.price <= 0) {
      return;
    }

    onSelectItem({
      type: "custom",
      name: customItem.name,
      description: customItem.description,
      price: customItem.price,
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Item to Quote</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "all" | "product" | "service")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="product">Products</TabsTrigger>
            <TabsTrigger value="service">Services</TabsTrigger>
          </TabsList>

          <TabsContent value={searchType} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search for products or services..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {loading && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900" />
              </div>
            )}

            {!loading && searchTerm.length >= 3 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items found matching &quot;{searchTerm}&quot;
                  </div>
                ) : (
                  results.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.type === "product" ? (
                              <Package className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Briefcase className="h-4 w-4 text-purple-600" />
                            )}
                            <span className="font-medium">{item.name}</span>
                            {item.sku && (
                              <Badge variant="outline" className="text-xs">
                                {item.sku}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            {item.type === "product" && item.price !== null && (
                              <span className="font-medium">
                                {formatCurrency(item.price)}
                              </span>
                            )}
                            {item.type === "service" && item.rate !== null && (
                              <span className="font-medium">
                                {formatCurrency(item.rate)}
                                {item.rate_type === "hourly" && "/hr"}
                              </span>
                            )}
                            {item.category && (
                              <Badge variant="secondary">{item.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.type === "product" && item.availability && item.availability.length > 0 ? (
                        <div className="border-t pt-2 space-y-1">
                          <p className="text-xs text-gray-500 mb-1">Select warehouse:</p>
                          {item.availability.map((warehouse) => (
                            <div
                              key={warehouse.warehouse_id}
                              className="flex items-center justify-between"
                            >
                              <div className="text-sm">
                                <span className="font-medium">{warehouse.warehouse_name}</span>
                                <span className="text-gray-500 ml-2">
                                  {warehouse.available_quantity} available
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectProduct(item, warehouse.warehouse_id)}
                                disabled={warehouse.available_quantity <= 0}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : item.type === "service" ? (
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => onSelectItem(item)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Service
                          </Button>
                        </div>
                      ) : item.type === "product" ? (
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectItem(item)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add (No Stock)
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}

            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="text-center py-4 text-gray-500">
                Type at least 3 characters to search
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Or add a custom item:</h4>
          <div className="space-y-2">
            <Input
              placeholder="Item name"
              value={customItem.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItem({ ...customItem, name: e.target.value })}
            />
            <Input
              placeholder="Description (optional)"
              value={customItem.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItem({ ...customItem, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Price"
                value={customItem.price || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
              <Button
                onClick={handleAddCustomItem}
                disabled={!customItem.name || customItem.price <= 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Custom
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}