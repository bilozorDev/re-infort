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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";
    
    let query = supabase
      .from("service_categories")
      .select("*")
      .eq("organization_clerk_id", orgId)
      .order("created_at", { ascending: true });

    // Apply status filter if requested
    if (activeOnly) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching service categories:", error);
      return NextResponse.json({ error: "Failed to fetch service categories" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/service-categories:", error);
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

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create service categories" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, status = "active" } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Get current user name
    const userName = await getCurrentUserName();

    const supabase = await createClient();

    // Create the service category
    const categoryData: TablesInsert<"service_categories"> = {
      organization_clerk_id: orgId,
      name: name.trim(),
      description: description?.trim() || null,
      status,
      created_by_clerk_user_id: userId,
      created_by_name: userName,
    };

    const { data, error } = await supabase
      .from("service_categories")
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error("Error creating service category:", error);
      if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create service category" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/service-categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}