import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { 
  getDefaultTablePreferences,
  resetTablePreferences,
  updateTablePreferences} from "@/app/lib/services/user-preferences.service";
import { isAdmin } from "@/app/utils/roles";

/**
 * PATCH /api/user/preferences/table/[tableKey]
 * Update table preferences for a specific table
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tableKey: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { tableKey } = await params;
    const preferences = await request.json();
    
    const updatedPreferences = await updateTablePreferences(
      userId,
      tableKey,
      preferences
    );
    
    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error("Error updating table preferences:", error);
    return NextResponse.json(
      { error: "Failed to update table preferences" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/preferences/table/[tableKey]
 * Reset table preferences to defaults
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableKey: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { tableKey } = await params;
    const preferences = await resetTablePreferences(userId, tableKey);
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error resetting table preferences:", error);
    return NextResponse.json(
      { error: "Failed to reset table preferences" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/preferences/table/[tableKey]
 * Get default preferences for a specific table
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableKey: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { tableKey } = await params;
    const userIsAdmin = await isAdmin();
    const defaults = getDefaultTablePreferences(tableKey, userIsAdmin);
    
    return NextResponse.json(defaults);
  } catch (error) {
    console.error("Error fetching default table preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch default preferences" },
      { status: 500 }
    );
  }
}