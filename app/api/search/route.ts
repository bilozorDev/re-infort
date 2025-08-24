import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId } from "@/app/utils/roles";

interface SearchResult {
  id: string;
  type: "product" | "service";
  name: string;
  description?: string | null;
  sku?: string;
  price?: number | null;
  rate?: number | null;
  rate_type?: string | null;
  unit?: string | null;
  category?: string | null;
  subcategory?: string | null;
  availability?: {
    warehouse_id: string;
    warehouse_name: string;
    available_quantity: number;
    reserved_quantity: number;
  }[];
  photo_url?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // 'product', 'service', or 'all'
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    if (!query || query.length < 3) {
      return NextResponse.json({ 
        results: [],
        message: "Please enter at least 3 characters to search"
      });
    }

    const supabase = await createClient();
    const results: SearchResult[] = [];

    // Search products if type is 'product' or 'all'
    if (type === "product" || type === "all" || !type) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          sku,
          price,
          photo_urls,
          status,
          category_id,
          subcategory_id,
          categories!products_category_id_fkey(name),
          subcategories!products_subcategory_id_fkey(name)
        `)
        .eq("organization_clerk_id", orgId)
        .eq("status", "active")
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(type === "all" ? Math.floor(limit / 2) : limit);

      if (!productsError && products) {
        // Get inventory data for each product
        for (const product of products) {
          const { data: inventory } = await supabase
            .from("inventory")
            .select(`
              warehouse_id,
              quantity,
              reserved_quantity,
              warehouses!inventory_warehouse_id_fkey(name)
            `)
            .eq("product_id", product.id)
            .eq("organization_clerk_id", orgId);

          const availability = inventory?.map((inv) => ({
            warehouse_id: inv.warehouse_id,
            warehouse_name: (inv.warehouses as { name?: string })?.name || "Unknown",
            available_quantity: inv.quantity - inv.reserved_quantity,
            reserved_quantity: inv.reserved_quantity
          })) || [];

          results.push({
            id: product.id,
            type: "product",
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: product.price,
            category: 'categories' in product && product.categories ? (product.categories as { name?: string }).name : undefined,
            subcategory: 'subcategories' in product && product.subcategories ? (product.subcategories as { name?: string }).name : undefined,
            availability,
            photo_url: product.photo_urls?.[0] || null
          });
        }
      }
    }

    // Search services if type is 'service' or 'all'
    if (type === "service" || type === "all" || !type) {
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("organization_clerk_id", orgId)
        .eq("status", "active")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(type === "all" ? Math.floor(limit / 2) : limit);

      if (!servicesError && services) {
        for (const service of services) {
          results.push({
            id: service.id,
            type: "service",
            name: service.name,
            description: service.description,
            rate: service.rate,
            rate_type: service.rate_type,
            unit: service.unit,
            category: service.category
          });
        }
      }
    }

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.name.localeCompare(b.name);
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
      hasMore: results.length > limit
    });
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}