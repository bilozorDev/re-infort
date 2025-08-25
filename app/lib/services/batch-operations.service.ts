import { createClient } from "@/app/lib/supabase/server";
import { type Product } from "@/app/types/product";
import { isAdmin } from "@/app/utils/roles";

interface BatchUpdateResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
}

interface BatchProductUpdate {
  id: string;
  updates: Partial<Product>;
}

interface BatchInventoryAdjustment {
  productId: string;
  warehouseId: string;
  quantity: number;
  type: "add" | "remove" | "set";
  reason?: string;
}

interface BatchStockTransfer {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
}

/**
 * Batch update multiple products
 * Processes updates in chunks to avoid overwhelming the database
 * Requires admin role for security
 */
export async function batchUpdateProducts(
  updates: BatchProductUpdate[],
  organizationId: string,
  chunkSize: number = 10
): Promise<BatchUpdateResult<BatchProductUpdate>> {
  // Check admin role before proceeding
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can perform batch product updates");
  }
  
  const supabase = await createClient();
  const result: BatchUpdateResult<BatchProductUpdate> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
  };

  // Process in chunks
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    
    // Process chunk in parallel
    const chunkResults = await Promise.allSettled(
      chunk.map(async (update) => {
        const { error } = await supabase
          .from("products")
          .update(update.updates)
          .eq("id", update.id)
          .eq("organization_clerk_id", organizationId);

        if (error) {
          throw new Error(error.message);
        }
        
        return update;
      })
    );

    // Process results
    chunkResults.forEach((chunkResult, index) => {
      if (chunkResult.status === "fulfilled") {
        result.successful.push(chunkResult.value);
        result.totalSuccess++;
      } else {
        result.failed.push({
          item: chunk[index],
          error: chunkResult.reason?.message || "Unknown error",
        });
        result.totalFailed++;
      }
      result.totalProcessed++;
    });
  }

  return result;
}

/**
 * Batch adjust inventory for multiple products/warehouses
 * Uses database transaction to ensure consistency
 * Requires admin role for security
 */
export async function batchAdjustInventory(
  adjustments: BatchInventoryAdjustment[],
  userId: string,
  chunkSize: number = 10
): Promise<BatchUpdateResult<BatchInventoryAdjustment>> {
  // Check admin role before proceeding
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can perform batch inventory adjustments");
  }
  
  const supabase = await createClient();
  const result: BatchUpdateResult<BatchInventoryAdjustment> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
  };

  // Group adjustments by warehouse to minimize lock contention
  const groupedAdjustments = adjustments.reduce((acc, adj) => {
    const key = adj.warehouseId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(adj);
    return acc;
  }, {} as Record<string, BatchInventoryAdjustment[]>);

  // Process each warehouse group
  for (const [, warehouseAdjustments] of Object.entries(groupedAdjustments)) {
    // Process in chunks within each warehouse
    for (let i = 0; i < warehouseAdjustments.length; i += chunkSize) {
      const chunk = warehouseAdjustments.slice(i, i + chunkSize);
      
      // Use RPC function for atomic operations
      const { data, error } = await supabase.rpc("batch_adjust_inventory", {
        p_adjustments: chunk.map(adj => ({
          product_id: adj.productId,
          warehouse_id: adj.warehouseId,
          quantity_change: adj.type === "set" 
            ? adj.quantity // For set, we'll need to calculate the difference in the RPC
            : adj.type === "add" 
            ? adj.quantity 
            : -adj.quantity,
          operation_type: adj.type,
          reason: adj.reason,
        })),
        p_user_id: userId,
      });

      if (error) {
        // Mark all items in chunk as failed
        chunk.forEach(item => {
          result.failed.push({
            item,
            error: error.message,
          });
          result.totalFailed++;
          result.totalProcessed++;
        });
      } else {
        // Process individual results from RPC
        if (data && Array.isArray(data)) {
          data.forEach((itemResult: unknown, index: number) => {
            const itemRes = itemResult as { success: boolean; error?: string };
            if (itemRes.success) {
              result.successful.push(chunk[index]);
              result.totalSuccess++;
            } else {
              result.failed.push({
                item: chunk[index],
                error: itemRes.error || "Operation failed",
              });
              result.totalFailed++;
            }
            result.totalProcessed++;
          });
        } else {
          // If no detailed results, assume all succeeded
          chunk.forEach(item => {
            result.successful.push(item);
            result.totalSuccess++;
            result.totalProcessed++;
          });
        }
      }
    }
  }

  return result;
}

/**
 * Batch transfer stock between warehouses
 * Ensures atomic operations for each transfer
 * Requires admin role for security
 */
export async function batchStockTransfers(
  transfers: BatchStockTransfer[],
  userId: string,
  chunkSize: number = 5
): Promise<BatchUpdateResult<BatchStockTransfer>> {
  // Check admin role before proceeding
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can perform batch stock transfers");
  }
  
  const supabase = await createClient();
  const result: BatchUpdateResult<BatchStockTransfer> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
  };

  // Process transfers in smaller chunks since they're more complex
  for (let i = 0; i < transfers.length; i += chunkSize) {
    const chunk = transfers.slice(i, i + chunkSize);
    
    // Process each transfer individually to ensure atomicity
    const transferResults = await Promise.allSettled(
      chunk.map(async (transfer) => {
        const { error } = await supabase.rpc("transfer_inventory", {
          p_product_id: transfer.productId,
          p_from_warehouse_id: transfer.fromWarehouseId,
          p_to_warehouse_id: transfer.toWarehouseId,
          p_quantity: transfer.quantity,
          p_reason: transfer.reason,
          p_notes: `Batch transfer by ${userId}`,
        });

        if (error) {
          throw new Error(error.message);
        }
        
        return transfer;
      })
    );

    // Process results
    transferResults.forEach((transferResult, index) => {
      if (transferResult.status === "fulfilled") {
        result.successful.push(transferResult.value);
        result.totalSuccess++;
      } else {
        result.failed.push({
          item: chunk[index],
          error: transferResult.reason?.message || "Unknown error",
        });
        result.totalFailed++;
      }
      result.totalProcessed++;
    });
  }

  return result;
}

/**
 * Batch delete products
 * Checks for inventory before deletion
 * Requires admin role for security
 */
export async function batchDeleteProducts(
  productIds: string[],
  organizationId: string,
  chunkSize: number = 10
): Promise<BatchUpdateResult<string>> {
  // Check admin role before proceeding
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can perform batch product deletions");
  }
  
  const supabase = await createClient();
  const result: BatchUpdateResult<string> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
  };

  // First, check which products have inventory
  const { data: productsWithInventory } = await supabase
    .from("inventory")
    .select("product_id")
    .in("product_id", productIds)
    .gt("quantity", 0);

  const hasInventorySet = new Set(
    productsWithInventory?.map(item => item.product_id) || []
  );

  // Separate products that can and cannot be deleted
  const canDelete = productIds.filter(id => !hasInventorySet.has(id));
  const cannotDelete = productIds.filter(id => hasInventorySet.has(id));

  // Mark products with inventory as failed
  cannotDelete.forEach(id => {
    result.failed.push({
      item: id,
      error: "Product has existing inventory",
    });
    result.totalFailed++;
    result.totalProcessed++;
  });

  // Delete products without inventory in chunks
  for (let i = 0; i < canDelete.length; i += chunkSize) {
    const chunk = canDelete.slice(i, i + chunkSize);
    
    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", chunk)
      .eq("organization_clerk_id", organizationId);

    if (error) {
      chunk.forEach(id => {
        result.failed.push({
          item: id,
          error: error.message,
        });
        result.totalFailed++;
        result.totalProcessed++;
      });
    } else {
      chunk.forEach(id => {
        result.successful.push(id);
        result.totalSuccess++;
        result.totalProcessed++;
      });
    }
  }

  return result;
}

/**
 * Batch import products from CSV or JSON
 * Validates and creates products with proper error handling
 * Requires admin role for security
 */
export async function batchImportProducts(
  products: Partial<Product>[],
  organizationId: string,
  userId: string,
  skipDuplicates: boolean = true,
  chunkSize: number = 20
): Promise<BatchUpdateResult<Partial<Product>>> {
  // Check admin role before proceeding
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can perform batch product imports");
  }
  
  const supabase = await createClient();
  const result: BatchUpdateResult<Partial<Product>> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
  };

  // Check for duplicate SKUs if needed
  if (skipDuplicates) {
    const skus = products.map(p => p.sku).filter(Boolean);
    const { data: existingProducts } = await supabase
      .from("products")
      .select("sku")
      .in("sku", skus as string[])
      .eq("organization_clerk_id", organizationId);

    const existingSkus = new Set(existingProducts?.map(p => p.sku) || []);
    
    // Filter out duplicates
    const uniqueProducts = products.filter(p => !p.sku || !existingSkus.has(p.sku));
    const duplicates = products.filter(p => p.sku && existingSkus.has(p.sku));
    
    // Mark duplicates as failed
    duplicates.forEach(product => {
      result.failed.push({
        item: product,
        error: `Product with SKU ${product.sku} already exists`,
      });
      result.totalFailed++;
      result.totalProcessed++;
    });
    
    products = uniqueProducts;
  }

  // Import products in chunks
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    
    const productsToInsert = chunk.map(product => ({
      ...product,
      organization_clerk_id: organizationId,
      created_by_clerk_user_id: userId,
    }));

    const { data, error } = await supabase
      .from("products")
      .insert(productsToInsert)
      .select();

    if (error) {
      chunk.forEach(product => {
        result.failed.push({
          item: product,
          error: error.message,
        });
        result.totalFailed++;
        result.totalProcessed++;
      });
    } else if (data) {
      data.forEach((_, index) => {
        result.successful.push(chunk[index]);
        result.totalSuccess++;
        result.totalProcessed++;
      });
    }
  }

  return result;
}