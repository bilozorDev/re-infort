"use client";

import { Briefcase, Edit,Package, Trash2 } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { formatCurrency } from "@/app/utils/formatters";

interface QuoteItem {
  id: string;
  type: "product" | "service" | "custom";
  product_id?: string;
  service_id?: string;
  warehouse_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  subtotal: number;
}

interface QuoteItemsListProps {
  items: QuoteItem[];
  onUpdateItem: (index: number, updates: Partial<QuoteItem>) => void;
  onRemoveItem: (index: number) => void;
  readonly?: boolean;
}

export default function QuoteItemsList({
  items,
  onUpdateItem,
  onRemoveItem,
  readonly = false,
}: QuoteItemsListProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "service":
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      default:
        return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getItemBadge = (type: string) => {
    switch (type) {
      case "product":
        return <Badge className="bg-blue-100 text-blue-800">Product</Badge>;
      case "service":
        return <Badge className="bg-purple-100 text-purple-800">Service</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Custom</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getItemIcon(item.type)}</div>
              <div>
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
                <div className="mt-2">{getItemBadge(item.type)}</div>
              </div>
            </div>
            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Quantity</label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                min="1"
                disabled={readonly}
              />
            </div>

            <div className="col-span-3">
              <label className="text-xs text-gray-500">Unit Price</label>
              <Input
                type="number"
                value={item.unit_price}
                onChange={(e) => onUpdateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                disabled={readonly}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-500">Discount</label>
              <Select
                value={item.discount_type || "none"}
                onValueChange={(value) => 
                  onUpdateItem(index, { 
                    discount_type: value === "none" ? undefined : value as "percentage" | "fixed",
                    discount_value: value === "none" ? undefined : item.discount_value
                  })
                }
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">$</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {item.discount_type && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Value</label>
                <Input
                  type="number"
                  value={item.discount_value || 0}
                  onChange={(e) => onUpdateItem(index, { discount_value: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder={item.discount_type === "percentage" ? "%" : "$"}
                  disabled={readonly}
                />
              </div>
            )}

            <div className={`${item.discount_type ? "col-span-3" : "col-span-5"} text-right`}>
              <label className="text-xs text-gray-500">Subtotal</label>
              <div className="text-lg font-semibold">{formatCurrency(item.subtotal)}</div>
            </div>
          </div>

          {item.discount_type && item.discount_value && item.discount_value > 0 && (
            <div className="mt-2 text-sm text-green-600">
              Discount applied: {item.discount_type === "percentage" 
                ? `${item.discount_value}%` 
                : formatCurrency(item.discount_value)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}