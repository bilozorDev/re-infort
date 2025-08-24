import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId } from "@/app/utils/roles";
import { getCurrentUserName } from "@/app/utils/user";

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
    const supabase = await createClient();

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        client:clients(id, name, email, company),
        items:quote_items(*)
      `)
      .eq("id", quoteId)
      .eq("organization_clerk_id", orgId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check if quote has items
    if (!quote.items || quote.items.length === 0) {
      return NextResponse.json(
        { error: "Cannot send a quote without items" },
        { status: 400 }
      );
    }

    // Check if client has email
    if (!quote.client?.email) {
      return NextResponse.json(
        { error: "Client must have an email address" },
        { status: 400 }
      );
    }

    const userName = await getCurrentUserName();

    // Generate access token for client portal
    const { data: tokenData, error: tokenError } = await supabase
      .from("quote_access_tokens")
      .insert({
        quote_id: quoteId,
        organization_clerk_id: orgId,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating access token:", tokenError);
      return NextResponse.json(
        { error: "Failed to create access token" },
        { status: 500 }
      );
    }

    // Update quote status to sent
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", quoteId)
      .eq("organization_clerk_id", orgId);

    if (updateError) {
      console.error("Error updating quote status:", updateError);
      return NextResponse.json(
        { error: "Failed to update quote status" },
        { status: 500 }
      );
    }

    // Reserve inventory for all product items
    for (const item of quote.items) {
      if (item.type === "product" && item.product_id && item.warehouse_id) {
        await supabase.rpc("reserve_quote_inventory", {
          p_quote_item_id: item.id,
          p_user_name: userName
        });
      }
    }

    // Record the send event
    await supabase
      .from("quote_events")
      .insert({
        quote_id: quoteId,
        organization_clerk_id: orgId,
        event_type: "sent",
        user_id: userId,
        user_type: "team",
        user_name: userName,
        event_metadata: {
          recipient: quote.client.email,
          token: tokenData.token
        }
      });

    // TODO: Send email via Resend
    // For now, we'll just return the access URL
    const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quote/${tokenData.token}`;

    return NextResponse.json({
      success: true,
      access_url: accessUrl,
      token: tokenData.token,
      expires_at: tokenData.expires_at,
      message: "Quote sent successfully (email integration pending)"
    });
  } catch (error) {
    console.error("Error in POST /api/quotes/[id]/send:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}