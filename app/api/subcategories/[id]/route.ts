import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  deleteSubcategory,
  getSubcategoryById,
  updateSubcategory,
} from "@/app/lib/services/category.service";
import { createClient } from "@/app/lib/supabase/server";
import { updateSubcategorySchema } from "@/app/lib/validations/product";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 });
    }

    const subcategory = await getSubcategoryById(id, orgId);

    if (!subcategory) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // Get product count
    const supabase = await createClient();
    
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("subcategory_id", id)
      .eq("organization_clerk_id", orgId);

    return NextResponse.json({
      ...subcategory,
      product_count: productCount || 0,
    });
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch subcategory" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSubcategorySchema.parse(body);

    const subcategory = await updateSubcategory(id, validatedData, orgId);

    return NextResponse.json(subcategory);
  } catch (error) {
    console.error("Error updating subcategory:", error);
    if (error instanceof Error) {
      if (error.message.includes("administrators")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a force delete
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get("force") === "true";

    if (!forceDelete) {
      // Check for existing products
      const supabase = await createClient();
      
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("subcategory_id", id)
        .eq("organization_clerk_id", orgId);

      // Return count so frontend can show appropriate warning
      if (productCount) {
        return NextResponse.json(
          { 
            error: "Subcategory has products",
            product_count: productCount || 0,
            message: `This subcategory is assigned to ${productCount} products. Deleting will unassign these products.`
          },
          { status: 409 }
        );
      }
    }

    // Proceed with deletion (force or no dependencies)
    await deleteSubcategory(id, orgId, forceDelete);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    if (error instanceof Error) {
      if (error.message.includes("administrators")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}