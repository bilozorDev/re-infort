import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesUpdate } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/services/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update services
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update services" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate rate if provided
    if (body.rate !== undefined && body.rate !== null && body.rate < 0) {
      return NextResponse.json(
        { error: "Rate must be a positive number" },
        { status: 400 }
      );
    }

    // Validate rate_type if provided
    const validRateTypes = ["hourly", "fixed", "custom"];
    if (body.rate_type && !validRateTypes.includes(body.rate_type)) {
      return NextResponse.json(
        { error: "Invalid rate type. Must be hourly, fixed, or custom" },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ["active", "inactive"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be active or inactive" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if service exists
    const { data: existingService, error: checkError } = await supabase
      .from("services")
      .select("id")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: TablesUpdate<"services"> = {};
    
    const allowedFields = [
      "name", "description", "category", "service_category_id",
      "rate_type", "rate", "unit", "status"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field as keyof TablesUpdate<"services">] = body[field];
      }
    }

    const { data, error } = await supabase
      .from("services")
      .update(updateData)
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .select()
      .single();

    if (error) {
      // Check for duplicate name
      if (error.code === "23505" && error.message.includes("unique_service_name_per_org")) {
        return NextResponse.json(
          { error: "A service with this name already exists in your organization" },
          { status: 409 }
        );
      }
      
      console.error("Error updating service:", error);
      return NextResponse.json(
        { error: "Failed to update service" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/services/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete services
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete services" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    // Check if service is used in any quotes
    const { data: quoteItems, error: quoteItemsError } = await supabase
      .from("quote_items")
      .select("id")
      .eq("service_id", id)
      .eq("organization_clerk_id", orgId)
      .limit(1);

    if (quoteItemsError) {
      console.error("Error checking quote items:", quoteItemsError);
      return NextResponse.json(
        { error: "Failed to check service dependencies" },
        { status: 500 }
      );
    }

    if (quoteItems && quoteItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete service that is used in quotes. Please remove it from quotes first." },
        { status: 409 }
      );
    }

    // Delete the service
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      console.error("Error deleting service:", error);
      return NextResponse.json(
        { error: "Failed to delete service" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/services/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}