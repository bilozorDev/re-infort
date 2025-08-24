import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesInsert } from "@/app/types/database.types";
import { getCurrentOrgId } from "@/app/utils/roles";
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
    const tags = searchParams.get("tags");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    let query = supabase
      .from("clients")
      .select("*")
      .eq("organization_clerk_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply tags filter
    if (tags) {
      const tagArray = tags.split(",");
      query = query.contains("tags", tagArray);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      count,
      limit,
      offset 
    });
  } catch (error) {
    console.error("Error in GET /api/clients:", error);
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

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const userName = await getCurrentUserName();

    const clientData: TablesInsert<"clients"> = {
      organization_clerk_id: orgId,
      created_by_clerk_user_id: userId,
      created_by_name: userName,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      address: body.address || null,
      city: body.city || null,
      state_province: body.state_province || null,
      postal_code: body.postal_code || null,
      country: body.country || null,
      notes: body.notes || null,
      tags: body.tags || [],
    };

    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) {
      // Check for duplicate email
      if (error.code === "23505" && error.message.includes("unique_client_email_per_org")) {
        return NextResponse.json(
          { error: "A client with this email already exists in your organization" },
          { status: 409 }
        );
      }
      
      console.error("Error creating client:", error);
      return NextResponse.json(
        { error: "Failed to create client" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}