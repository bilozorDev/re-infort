import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update low stock thresholds" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { low_stock_threshold } = body;

    // Validate threshold value
    if (typeof low_stock_threshold !== "number" || low_stock_threshold < 0) {
      return NextResponse.json(
        { error: "Invalid low stock threshold value" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update the product's low stock threshold
    const { data, error } = await supabase
      .from("products")
      .update({ low_stock_threshold })
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .select()
      .single();

    if (error) {
      console.error("Error updating low stock threshold:", error);
      return NextResponse.json(
        { error: "Failed to update low stock threshold" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/products/[id]/low-stock-threshold:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}