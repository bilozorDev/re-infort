import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { 
  getUserPreferences, 
  upsertUserPreferences 
} from "@/app/lib/services/user-preferences.service";

/**
 * GET /api/user/preferences
 * Get the current user's preferences
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const preferences = await getUserPreferences(userId);
    
    // Return empty preferences object if none exist
    if (!preferences) {
      return NextResponse.json({
        table_preferences: {},
        ui_preferences: {},
        feature_settings: {}
      });
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Update the current user's preferences
 */
export async function PATCH(request: Request) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const updates = await request.json();
    
    const preferences = await upsertUserPreferences(userId, orgId, updates);
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}