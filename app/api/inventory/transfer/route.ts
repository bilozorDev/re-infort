import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

interface TransferRequest {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can transfer inventory" },
        { status: 403 }
      );
    }

    // Get organization ID
    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Parse request body
    const body: TransferRequest = await request.json();
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason, notes } = body;

    // Validate required fields
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity" },
        { status: 400 }
      );
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }

    // Validate not transferring to same warehouse
    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json({ error: "Cannot transfer to the same warehouse" }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the transfer_inventory RPC function
    const { data, error } = await supabase.rpc("transfer_inventory", {
      p_product_id: productId,
      p_from_warehouse_id: fromWarehouseId,
      p_to_warehouse_id: toWarehouseId,
      p_quantity: quantity,
      p_reason: reason,
      p_notes: notes,
    });

    if (error) {
      console.error("Transfer inventory error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to transfer inventory" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Transfer inventory API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
