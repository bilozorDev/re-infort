import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

interface AdjustRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  movementType: string;
  reason?: string;
  referenceNumber?: string;
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
        { error: "Only administrators can adjust inventory" },
        { status: 403 }
      );
    }

    // Get organization ID
    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Parse request body
    const body: AdjustRequest = await request.json();
    const { productId, warehouseId, quantity, movementType, reason, referenceNumber } = body;

    // Validate required fields
    if (!productId || !warehouseId || quantity === undefined || !movementType) {
      return NextResponse.json(
        { error: "Missing required fields: productId, warehouseId, quantity, movementType" },
        { status: 400 }
      );
    }

    // Get current user's name for audit trail
    const userName = await getCurrentUserName();

    // Create Supabase client
    const supabase = await createClient();

    // Call the adjust_inventory RPC function with user name
    const { data, error } = await supabase.rpc("adjust_inventory", {
      p_product_id: productId,
      p_warehouse_id: warehouseId,
      p_quantity_change: quantity,
      p_movement_type: movementType,
      p_reason: reason,
      p_reference_number: referenceNumber,
      p_reference_type: null,
      p_user_name: userName,
    });

    if (error) {
      console.error("Adjust inventory error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to adjust inventory" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Adjust inventory API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
