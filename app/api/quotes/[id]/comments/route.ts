import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type TablesInsert } from "@/app/types/database.types";
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

    const { data: comments, error } = await supabase
      .from("quote_comments")
      .select("*")
      .eq("quote_id", id)
      .eq("organization_clerk_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error in GET /api/quotes/[id]/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    
    if (!body.comment || body.comment.trim() === "") {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if quote exists
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, created_by_clerk_user_id, assigned_to_clerk_user_id")
      .eq("id", quoteId)
      .eq("organization_clerk_id", orgId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check permissions - anyone in the org can comment
    const userIsAdmin = await isAdmin();
    const canComment = userIsAdmin || 
                      quote.created_by_clerk_user_id === userId ||
                      quote.assigned_to_clerk_user_id === userId ||
                      true; // Allow all team members to comment

    if (!canComment) {
      return NextResponse.json(
        { error: "You don't have permission to comment on this quote" },
        { status: 403 }
      );
    }

    const userName = await getCurrentUserName();

    const commentData: TablesInsert<"quote_comments"> = {
      quote_id: quoteId,
      organization_clerk_id: orgId,
      user_id: userId,
      user_type: "team",
      user_name: userName,
      comment: body.comment.trim(),
      is_internal: body.is_internal !== false, // Default to internal
    };

    const { data, error } = await supabase
      .from("quote_comments")
      .insert(commentData)
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Record event
    await supabase
      .from("quote_events")
      .insert({
        quote_id: quoteId,
        organization_clerk_id: orgId,
        event_type: "commented",
        user_id: userId,
        user_type: "team",
        user_name: userName,
        event_metadata: { 
          comment_preview: body.comment.substring(0, 100),
          is_internal: commentData.is_internal
        }
      });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/quotes/[id]/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}