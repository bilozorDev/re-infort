import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    // Verify token and get quote
    const { data: tokenData, error: tokenError } = await supabase
      .from("quote_access_tokens")
      .select("*, quote:quotes(*)")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 404 });
    }

    // Update quote status to viewed if it's currently sent
    if (tokenData.quote.status === "sent") {
      await supabase
        .from("quotes")
        .update({ status: "viewed" })
        .eq("id", tokenData.quote.id);

      // Record view event
      await supabase
        .from("quote_events")
        .insert({
          quote_id: tokenData.quote.id,
          organization_clerk_id: tokenData.organization_clerk_id,
          event_type: "viewed",
          user_id: null,
          user_type: "client",
          user_name: tokenData.quote.client?.name || "Client",
        });
    }

    // Record access
    await supabase
      .from("quote_access_tokens")
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: (tokenData.access_count || 0) + 1
      })
      .eq("token", token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/public/quote/[token]/view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}