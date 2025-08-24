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

    // Get client with quote statistics
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get quote statistics
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select("id, status, total, created_at")
      .eq("client_id", id)
      .eq("organization_clerk_id", orgId);

    if (quotesError) {
      console.error("Error fetching quotes:", quotesError);
    }

    const stats = {
      total_quotes: quotes?.length || 0,
      approved_quotes: quotes?.filter((q: any) => q.status === "approved" || q.status === "converted").length || 0,
      pending_quotes: quotes?.filter((q: any) => q.status === "sent" || q.status === "viewed").length || 0,
      total_value: quotes?.reduce((sum: number, q: any) => sum + (q.total || 0), 0) || 0,
      conversion_rate: quotes && quotes.length > 0 
        ? ((quotes.filter((q: any) => q.status === "converted").length / quotes.length) * 100).toFixed(1)
        : "0",
    };

    return NextResponse.json({ 
      ...client,
      stats,
      recent_quotes: quotes?.slice(0, 5) || []
    });
  } catch (error) {
    console.error("Error in GET /api/clients/[id]:", error);
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

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate email format if provided
    if (body.email !== undefined && body.email !== null && body.email !== "") {
      if (!isValidEmail(body.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (checkError || !existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: ClientUpdate = {};
    
    const allowedFields = [
      "name", "email", "phone", "company", 
      "address", "city", "state_province", 
      "postal_code", "country", "notes", "tags"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field as keyof TablesUpdate<"clients">] = body[field];
      }
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
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
      
      console.error("Error updating client:", error);
      return NextResponse.json(
        { error: "Failed to update client" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/clients/[id]:", error);
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

    // Only admins can delete clients
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete clients" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    // Check if client has any quotes
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select("id")
      .eq("client_id", id)
      .eq("organization_clerk_id", orgId)
      .limit(1);

    if (quotesError) {
      console.error("Error checking quotes:", quotesError);
      return NextResponse.json(
        { error: "Failed to check client dependencies" },
        { status: 500 }
      );
    }

    if (quotes && quotes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete client with existing quotes. Please delete or reassign quotes first." },
        { status: 409 }
      );
    }

    // Delete the client
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      console.error("Error deleting client:", error);
      return NextResponse.json(
        { error: "Failed to delete client" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/clients/[id]:", error);
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