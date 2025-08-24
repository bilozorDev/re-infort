import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesInsert } from "@/app/types/database.types";
import { getCurrentOrgId } from "@/app/utils/roles";

export async function POST(
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

    const { id: quoteId } = await context.params;
    const body = await request.json();
    const supabase = await createClient();

    // Verify quote exists and user has permission
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, created_by_clerk_user_id, assigned_to_clerk_user_id, status")
      .eq("id", quoteId)
      .eq("organization_clerk_id", orgId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check if user can edit this quote
    const canEdit = quote.created_by_clerk_user_id === userId ||
                   quote.assigned_to_clerk_user_id === userId;

    if (!canEdit) {
      const isUserAdmin = await import("@/app/utils/roles").then(m => m.isAdmin());
      if (!isUserAdmin) {
        return NextResponse.json(
          { error: "You don't have permission to edit this quote" },
          { status: 403 }
        );
      }
    }

    // Validate item type
    if (!["product", "service", "custom"].includes(body.item_type)) {
      return NextResponse.json(
        { error: "Invalid item type" },
        { status: 400 }
      );
    }

    // Validate required fields based on type
    if (body.item_type === "product" && !body.product_id) {
      return NextResponse.json(
        { error: "Product ID is required for product items" },
        { status: 400 }
      );
    }

    if (body.item_type === "service" && !body.service_id) {
      return NextResponse.json(
        { error: "Service ID is required for service items" },
        { status: 400 }
      );
    }

    // Get item details based on type
    let itemName = body.name;
    let itemDescription = body.description;
    let itemSku = body.sku;
    let unitPrice = body.unit_price;

    if (body.item_type === "product" && body.product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("name, description, sku, price")
        .eq("id", body.product_id)
        .single();

      if (product) {
        itemName = itemName || product.name;
        itemDescription = itemDescription || product.description;
        itemSku = itemSku || product.sku;
        unitPrice = unitPrice !== undefined ? unitPrice : product.price;
      }
    }

    if (body.item_type === "service" && body.service_id) {
      const { data: service } = await supabase
        .from("services")
        .select("name, description, rate")
        .eq("id", body.service_id)
        .single();

      if (service) {
        itemName = itemName || service.name;
        itemDescription = itemDescription || service.description;
        unitPrice = unitPrice !== undefined ? unitPrice : service.rate;
      }
    }

    // Create quote item
    const itemData: TablesInsert<"quote_items"> = {
      quote_id: quoteId,
      organization_clerk_id: orgId,
      item_type: body.item_type,
      product_id: body.product_id || null,
      service_id: body.service_id || null,
      warehouse_id: body.warehouse_id || null,
      name: itemName,
      description: itemDescription || null,
      sku: itemSku || null,
      quantity: body.quantity || 1,
      unit_price: unitPrice || 0,
      discount_type: body.discount_type || null,
      discount_value: body.discount_value || 0,
      display_order: body.display_order || 0,
    };

    const { data, error } = await supabase
      .from("quote_items")
      .insert(itemData)
      .select(`
        *,
        product:products(id, name, sku, price),
        service:services(id, name, rate, rate_type, unit),
        warehouse:warehouses(id, name)
      `)
      .single();

    if (error) {
      console.error("Error creating quote item:", error);
      return NextResponse.json(
        { error: "Failed to create quote item" },
        { status: 500 }
      );
    }

    // Reserve inventory if it's a product with a warehouse
    if (body.item_type === "product" && body.product_id && body.warehouse_id && quote.status === "sent") {
      await supabase.rpc("reserve_quote_inventory", {
        p_quote_item_id: data.id,
        p_user_name: body.user_name
      });
    }

    // Recalculate quote totals
    await supabase.rpc("calculate_quote_totals", { p_quote_id: quoteId });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/quotes/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { id: quoteId } = await context.params;
    const supabase = await createClient();

    // Verify quote exists
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id")
      .eq("id", quoteId)
      .eq("organization_clerk_id", orgId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Get all items for this quote
    const { data, error } = await supabase
      .from("quote_items")
      .select(`
        *,
        product:products(id, name, sku, price, photo_urls),
        service:services(id, name, rate, rate_type, unit),
        warehouse:warehouses(id, name)
      `)
      .eq("quote_id", quoteId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching quote items:", error);
      return NextResponse.json(
        { error: "Failed to fetch quote items" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/quotes/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}