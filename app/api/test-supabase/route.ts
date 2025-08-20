import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Simple test - just verify we can create a client
    // For a more thorough test, you could try to query auth.users() or another system table
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Not being logged in is fine, we just want to verify the connection works
    if (authError && authError.message !== "Auth session missing!") {
      throw authError;
    }

    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to Supabase",
      authenticated: !!user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Supabase connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Supabase",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
