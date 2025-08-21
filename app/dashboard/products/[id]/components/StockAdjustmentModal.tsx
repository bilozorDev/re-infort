"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useAdjustStock } from "@/app/hooks/use-inventory";
import { useWarehouses } from "@/app/hooks/use-warehouses";

interface StockAdjustmentModalProps {
  productId: string;
  warehouseId?: string | null;
  type: "add" | "remove";
  isOpen: boolean;
  onClose: () => void;
}

export function StockAdjustmentModal({
  productId,
  warehouseId,
  type,
  isOpen,
  onClose,
}: StockAdjustmentModalProps) {
  const { data: warehouses } = useWarehouses();
  const adjustStock = useAdjustStock();
  
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouseId || "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWarehouse || !quantity) return;
    
    setIsSubmitting(true);
    
    try {
      await adjustStock.mutateAsync({
        productId,
        warehouseId: selectedWarehouse,
        quantity: type === "add" ? parseInt(quantity) : -parseInt(quantity),
        movementType: type === "add" ? "receipt" : "adjustment",
        reason: reason || undefined,
        referenceNumber: referenceNumber || undefined,
      });
      
      onClose();
      // Reset form
      setSelectedWarehouse(warehouseId || "");
      setQuantity("");
      setReason("");
      setReferenceNumber("");
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                {type === "add" ? "Add Stock" : "Remove Stock"}
              </DialogTitle>
              
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700">
                    Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="warehouse"
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    disabled={!!warehouseId}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses?.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter quantity"
                  />
                </div>
                
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    id="reference"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., PO-12345"
                  />
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder={type === "add" ? "e.g., New stock received" : "e.g., Damaged items"}
                  />
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedWarehouse || !quantity}
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:col-start-2 ${
                      type === "add"
                        ? "bg-green-600 hover:bg-green-500 disabled:bg-green-300"
                        : "bg-red-600 hover:bg-red-500 disabled:bg-red-300"
                    }`}
                  >
                    {isSubmitting ? "Processing..." : type === "add" ? "Add Stock" : "Remove Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}