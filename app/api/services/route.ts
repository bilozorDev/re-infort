import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesInsert } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

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

    const supabase = await createClient();
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "active";

    let query = supabase
      .from("services")
      .select(`
        *,
        service_category:service_categories(*)
      `)
      .eq("organization_clerk_id", orgId)
      .order("name", { ascending: true });

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Apply category filter (support both old and new category system)
    if (category) {
      query = query.or(`category.eq.${category},service_category_id.eq.${category}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching services:", error);
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }

    // Get service categories for the organization
    const { data: categories } = await supabase
      .from("service_categories")
      .select("*")
      .eq("organization_clerk_id", orgId)
      .eq("status", "active")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    return NextResponse.json({ 
      data,
      categories
    });
  } catch (error) {
    console.error("Error in GET /api/services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create services
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create services" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Validate rate if provided
    if (body.rate !== undefined && body.rate !== null && body.rate < 0) {
      return NextResponse.json(
        { error: "Rate must be a positive number" },
        { status: 400 }
      );
    }

    // Validate rate_type
    const validRateTypes = ["hourly", "fixed", "custom"];
    if (body.rate_type && !validRateTypes.includes(body.rate_type)) {
      return NextResponse.json(
        { error: "Invalid rate type. Must be hourly, fixed, or custom" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const userName = await getCurrentUserName();

    const serviceData: TablesInsert<"services"> = {
      organization_clerk_id: orgId,
      created_by_clerk_user_id: userId,
      created_by_name: userName,
      name: body.name,
      description: body.description || null,
      category: body.category || null, // Keep for backward compatibility
      service_category_id: body.service_category_id || null,
      rate_type: body.rate_type || "fixed",
      rate: body.rate || null,
      unit: body.unit || null,
      status: body.status || "active",
    };

    const { data, error } = await supabase
      .from("services")
      .insert(serviceData)
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
      
      console.error("Error creating service:", error);
      return NextResponse.json(
        { error: "Failed to create service" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}