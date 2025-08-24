import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesUpdate } from "@/app/types/database.types";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

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

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        client:clients(*),
        items:quote_items(
          *,
          product:products(id, name, sku, price),
          service:services(id, name, rate, rate_type, unit),
          warehouse:warehouses(id, name)
        ),
        events:quote_events(*),
        comments:quote_comments(*)
      `)
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error in GET /api/quotes/[id]:", error);
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
    const supabase = await createClient();

    // Check if quote exists and user has permission
    const { data: existingQuote, error: checkError } = await supabase
      .from("quotes")
      .select("id, created_by_clerk_user_id, assigned_to_clerk_user_id, status")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (checkError || !existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check permissions
    const userIsAdmin = await isAdmin();
    const canEdit = userIsAdmin || 
                   existingQuote.created_by_clerk_user_id === userId ||
                   existingQuote.assigned_to_clerk_user_id === userId;

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this quote" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: TablesUpdate<"quotes"> = {};
    
    const allowedFields = [
      "client_id", "status", "valid_from", "valid_until",
      "discount_type", "discount_value", "tax_rate",
      "terms_and_conditions", "notes", "internal_notes",
      "assigned_to_clerk_user_id", "assigned_to_name"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field as keyof TablesUpdate<"quotes">] = body[field];
      }
    }

    const { data, error } = await supabase
      .from("quotes")
      .update(updateData)
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .select(`
        *,
        client:clients(id, name, email, company),
        items:quote_items(*)
      `)
      .single();

    if (error) {
      console.error("Error updating quote:", error);
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    // Record the update event
    const userName = await getCurrentUserName();

    await supabase
      .from("quote_events")
      .insert({
        quote_id: id,
        organization_clerk_id: orgId,
        event_type: "updated",
        user_id: userId,
        user_type: "team",
        user_name: userName,
        event_metadata: { changes: Object.keys(updateData) }
      });

    // If status changed, record specific event
    if (body.status && body.status !== existingQuote.status) {
      await supabase
        .from("quote_events")
        .insert({
          quote_id: id,
          organization_clerk_id: orgId,
          event_type: body.status,
          user_id: userId,
          user_type: "team",
          user_name: userName,
        });
    }

    // Recalculate totals if needed
    if (body.discount_type !== undefined || body.discount_value !== undefined || body.tax_rate !== undefined) {
      await supabase.rpc("calculate_quote_totals", { p_quote_id: id });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/quotes/[id]:", error);
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

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete quotes" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    // Check if quote exists
    const { data: existingQuote, error: checkError } = await supabase
      .from("quotes")
      .select("id, quote_number, status")
      .eq("id", id)
      .eq("organization_clerk_id", orgId)
      .single();

    if (checkError || !existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Release any reservations
    if (existingQuote.status === "sent" || existingQuote.status === "viewed") {
      await supabase.rpc("release_quote_reservations", { 
        p_quote_id: id,
        p_reason: "Quote deleted"
      });
    }

    // Delete the quote (cascades to items, events, comments, tokens)
    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      console.error("Error deleting quote:", error);
      return NextResponse.json(
        { error: "Failed to delete quote" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/quotes/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}