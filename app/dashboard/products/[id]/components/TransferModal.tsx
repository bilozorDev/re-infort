"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { useProductWarehouseInventory, useTransferStock } from "@/app/hooks/use-inventory";

interface TransferModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TransferModal({ productId, isOpen, onClose }: TransferModalProps) {
  const { data: inventory } = useProductWarehouseInventory(productId);
  const transferStock = useTransferStock();
  
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);

  // Update max quantity when source warehouse changes
  useEffect(() => {
    if (fromWarehouse && inventory) {
      const sourceInventory = inventory.find(inv => inv.warehouse_id === fromWarehouse);
      setMaxQuantity(sourceInventory?.available_quantity || 0);
    } else {
      setMaxQuantity(0);
    }
  }, [fromWarehouse, inventory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromWarehouse || !toWarehouse || !quantity) return;
    
    setIsSubmitting(true);
    
    try {
      await transferStock.mutateAsync({
        productId,
        fromWarehouseId: fromWarehouse,
        toWarehouseId: toWarehouse,
        quantity: parseInt(quantity),
        reason: reason || undefined,
        notes: notes || undefined,
      });
      
      onClose();
      // Reset form
      setFromWarehouse("");
      setToWarehouse("");
      setQuantity("");
      setReason("");
      setNotes("");
    } catch (error) {
      console.error("Failed to transfer stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableWarehouses = inventory?.filter(inv => inv.warehouse_status === "active") || [];

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
                Transfer Stock Between Warehouses
              </DialogTitle>
              
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="from-warehouse" className="block text-sm font-medium text-gray-700">
                    From Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="from-warehouse"
                    value={fromWarehouse}
                    onChange={(e) => {
                      setFromWarehouse(e.target.value);
                      if (e.target.value === toWarehouse) {
                        setToWarehouse("");
                      }
                    }}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select source warehouse</option>
                    {availableWarehouses
                      .filter(inv => inv.available_quantity > 0)
                      .map((inv) => (
                        <option key={inv.warehouse_id} value={inv.warehouse_id}>
                          {inv.warehouse_name} (Available: {inv.available_quantity})
                        </option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="to-warehouse" className="block text-sm font-medium text-gray-700">
                    To Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="to-warehouse"
                    value={toWarehouse}
                    onChange={(e) => setToWarehouse(e.target.value)}
                    required
                    disabled={!fromWarehouse}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="">Select destination warehouse</option>
                    {availableWarehouses
                      .filter(inv => inv.warehouse_id !== fromWarehouse)
                      .map((inv) => (
                        <option key={inv.warehouse_id} value={inv.warehouse_id}>
                          {inv.warehouse_name}
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
                    max={maxQuantity}
                    required
                    disabled={!fromWarehouse}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    placeholder={maxQuantity > 0 ? `Max: ${maxQuantity}` : "Select source warehouse first"}
                  />
                  {fromWarehouse && maxQuantity === 0 && (
                    <p className="mt-1 text-sm text-red-600">No available stock in selected warehouse</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <input
                    type="text"
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Rebalancing inventory"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Additional notes about this transfer"
                  />
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !fromWarehouse || !toWarehouse || !quantity || maxQuantity === 0}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300 sm:col-start-2"
                  >
                    {isSubmitting ? "Transferring..." : "Transfer Stock"}
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