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
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");
    const assignedTo = searchParams.get("assigned_to");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    let query = supabase
      .from("quotes")
      .select(`
        *,
        client:clients(id, name, email, company),
        items:quote_items(*)
      `)
      .eq("organization_clerk_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }
    if (assignedTo) {
      query = query.eq("assigned_to_clerk_user_id", assignedTo);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching quotes:", error);
      return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      count,
      limit,
      offset 
    });
  } catch (error) {
    console.error("Error in GET /api/quotes:", error);
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
    if (!body.client_id) {
      return NextResponse.json(
        { error: "Client is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const userName = await getCurrentUserName();

    // Generate quote number
    const { data: quoteNumber, error: quoteNumberError } = await supabase
      .rpc("generate_quote_number", { p_org_id: orgId });

    if (quoteNumberError) {
      console.error("Error generating quote number:", quoteNumberError);
      return NextResponse.json(
        { error: "Failed to generate quote number" },
        { status: 500 }
      );
    }

    const quoteData: TablesInsert<"quotes"> = {
      organization_clerk_id: orgId,
      quote_number: quoteNumber,
      created_by_clerk_user_id: userId,
      created_by_name: userName,
      assigned_to_clerk_user_id: body.assigned_to_clerk_user_id || userId,
      assigned_to_name: body.assigned_to_name || userName,
      client_id: body.client_id,
      status: body.status || "draft",
      valid_from: body.valid_from || new Date().toISOString().split('T')[0],
      valid_until: body.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount_type: body.discount_type || null,
      discount_value: body.discount_value || 0,
      tax_rate: body.tax_rate || 0,
      terms_and_conditions: body.terms_and_conditions || null,
      notes: body.notes || null,
      internal_notes: body.internal_notes || null,
    };

    const { data, error } = await supabase
      .from("quotes")
      .insert(quoteData)
      .select(`
        *,
        client:clients(id, name, email, company)
      `)
      .single();

    if (error) {
      console.error("Error creating quote:", error);
      return NextResponse.json(
        { error: "Failed to create quote" },
        { status: 500 }
      );
    }

    // Create initial quote event
    await supabase
      .from("quote_events")
      .insert({
        quote_id: data.id,
        organization_clerk_id: orgId,
        event_type: "created",
        user_id: userId,
        user_type: "team",
        user_name: userName,
      });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/quotes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}