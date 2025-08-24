import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const supabase = await createClient();

    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: "A reason for declining is required" },
        { status: 400 }
      );
    }

    // Verify token and get quote
    const { data: tokenData, error: tokenError } = await supabase
      .from("quote_access_tokens")
      .select("*, quote:quotes(*, client:clients(*))")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 404 });
    }

    // Check if quote can be declined
    if (!["sent", "viewed"].includes(tokenData.quote.status)) {
      return NextResponse.json(
        { error: "This quote cannot be declined in its current state" },
        { status: 400 }
      );
    }

    // Update quote status
    await supabase
      .from("quotes")
      .update({ 
        status: "declined",
        declined_at: new Date().toISOString()
      })
      .eq("id", tokenData.quote.id);

    // Release any reservations
    await supabase.rpc("release_quote_reservations", {
      p_quote_id: tokenData.quote.id,
      p_reason: "Quote declined by client"
    });

    // Record decline event
    await supabase
      .from("quote_events")
      .insert({
        quote_id: tokenData.quote.id,
        organization_clerk_id: tokenData.organization_clerk_id,
        event_type: "declined",
        user_id: null,
        user_type: "client",
        user_name: tokenData.quote.client?.name || "Client",
        event_metadata: { reason: body.comment }
      });

    // Add comment with reason
    await supabase
      .from("quote_comments")
      .insert({
        quote_id: tokenData.quote.id,
        organization_clerk_id: tokenData.organization_clerk_id,
        user_id: null,
        user_type: "client",
        user_name: tokenData.quote.client?.name || "Client",
        comment: `Declined: ${body.comment.trim()}`,
        is_internal: false,
      });

    return NextResponse.json({ 
      success: true,
      message: "Quote declined"
    });
  } catch (error) {
    console.error("Error in POST /api/public/quote/[token]/decline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}