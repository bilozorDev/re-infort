import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET(
  _request: NextRequest,
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

    // Get the category with usage count
    const { data: category, error: categoryError } = await supabase
      .from("service_categories")
      .select("*")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: "Service category not found" },
        { status: 404 }
      );
    }

    // Count services using this category
    const { count: serviceCount } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("service_category_id", id)
      .eq("organization_clerk_id", orgId);

    return NextResponse.json({
      ...category,
      service_count: serviceCount || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/service-categories/[id]:", error);
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

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update service categories" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, description, status, display_order } = body;

    // Validate at least one field to update
    if (!name && description === undefined && !status && display_order === undefined) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build update object
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status) updateData.status = status;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from("service_categories")
      .update(updateData)
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .select()
      .single();

    if (error) {
      console.error("Error updating service category:", error);
      if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update service category" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Service category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/service-categories/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete service categories" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    // Check if category has services
    const { count: serviceCount } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("service_category_id", id)
      .eq("organization_clerk_id", orgId);

    if (serviceCount && serviceCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete category with existing services",
          message: `This category has ${serviceCount} service${serviceCount !== 1 ? 's' : ''}. Please reassign or delete the services first.`,
          service_count: serviceCount,
        },
        { status: 409 }
      );
    }

    // Delete the category
    const { error } = await supabase
      .from("service_categories")
      .delete()
      .eq("id", id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      console.error("Error deleting service category:", error);
      return NextResponse.json(
        { error: "Failed to delete service category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/service-categories/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}