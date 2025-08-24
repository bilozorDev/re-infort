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
        { error: "Comment cannot be empty" },
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

    // Add comment
    await supabase
      .from("quote_comments")
      .insert({
        quote_id: tokenData.quote.id,
        organization_clerk_id: tokenData.organization_clerk_id,
        user_id: null,
        user_type: "client",
        user_name: tokenData.quote.client?.name || "Client",
        comment: body.comment.trim(),
        is_internal: false,
      });

    // Record comment event
    await supabase
      .from("quote_events")
      .insert({
        quote_id: tokenData.quote.id,
        organization_clerk_id: tokenData.organization_clerk_id,
        event_type: "commented",
        user_id: null,
        user_type: "client",
        user_name: tokenData.quote.client?.name || "Client",
        event_metadata: { 
          comment_preview: body.comment.substring(0, 100)
        }
      });

    return NextResponse.json({ 
      success: true,
      message: "Comment added successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/public/quote/[token]/comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}