import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET() {
  try {
    const { userId } = await auth();
    const orgId = await getCurrentOrgId();
    const userIsAdmin = await isAdmin();
    
    // Get the JWT to see what's in it
    const { getToken } = await auth();
    const token = await getToken({ template: "supabase" });
    
    // Test the database connection and check what the database sees
    const supabase = await createClient();
    
    // Call the debug function we created
    const { data: debugData, error: debugError } = await supabase
      .rpc('test_admin_status');
    
    // Try to get the org_id as seen by the database
    const { data: jwtData, error: jwtError } = await supabase
      .rpc('debug_jwt_claims');
    
    return NextResponse.json({
      apiLevel: {
        userId,
        orgId,
        userIsAdmin,
        tokenExists: !!token,
      },
      databaseLevel: {
        debugData,
        debugError: debugError?.message,
        jwtData,
        jwtError: jwtError?.message,
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Debug failed" 
    }, { status: 500 });
  }
}