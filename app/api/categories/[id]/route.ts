import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/app/lib/services/category.service";
import { createClient } from "@/app/lib/supabase/server";
import { updateCategorySchema } from "@/app/lib/validations/product";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 });
    }

    const category = await getCategoryById(params.id, orgId);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Get subcategory and product counts
    const supabase = await createClient();
    
    const { count: subcategoryCount } = await supabase
      .from("subcategories")
      .select("*", { count: "exact", head: true })
      .eq("category_id", params.id)
      .eq("organization_clerk_id", orgId);

    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", params.id)
      .eq("organization_clerk_id", orgId);

    return NextResponse.json({
      ...category,
      subcategory_count: subcategoryCount || 0,
      product_count: productCount || 0,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const category = await updateCategory(params.id, validatedData, orgId);

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof Error) {
      if (error.message.includes("administrators")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for existing subcategories and products
    const supabase = await createClient();
    
    const { count: subcategoryCount } = await supabase
      .from("subcategories")
      .select("*", { count: "exact", head: true })
      .eq("category_id", params.id)
      .eq("organization_clerk_id", orgId);

    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", params.id)
      .eq("organization_clerk_id", orgId);

    // Return counts so frontend can show appropriate warning
    if (subcategoryCount || productCount) {
      return NextResponse.json(
        { 
          error: "Category has dependencies",
          subcategory_count: subcategoryCount || 0,
          product_count: productCount || 0,
          message: `This category has ${subcategoryCount || 0} subcategories and ${productCount || 0} products. Deleting will remove all subcategories and unassign products.`
        },
        { status: 409 }
      );
    }

    await deleteCategory(params.id, orgId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    if (error instanceof Error) {
      if (error.message.includes("administrators")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}