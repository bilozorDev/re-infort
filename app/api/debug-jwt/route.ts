import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  try {
    const { userId, sessionClaims, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the Supabase JWT token
    const supabaseToken = await getToken({ template: "supabase" });

    // Decode the JWT (without verifying signature, just to see the payload)
    let decodedToken = null;
    if (supabaseToken) {
      const [, payload] = supabaseToken.split(".");
      decodedToken = JSON.parse(Buffer.from(payload, "base64").toString());
    }

    // Test Supabase connection
    const supabase = await createClient();
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    return NextResponse.json(
      {
        clerkSession: {
          userId,
          sessionClaims,
        },
        supabaseJWT: {
          token: supabaseToken ? "Token exists" : "No token",
          decoded: decodedToken,
        },
        supabaseAuth: {
          user: authUser,
          error: authError?.message,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to debug JWT",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
