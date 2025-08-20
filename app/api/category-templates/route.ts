import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getTemplates } from "@/app/lib/services/category-template.service";
import { getCurrentOrgId } from "@/app/utils/roles";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const templates = await getTemplates();

    return NextResponse.json({ templates, totalCount: templates.length });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}