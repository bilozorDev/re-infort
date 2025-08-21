import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { importTemplate } from "@/app/lib/services/category-template.service";
import type { ImportTemplateRequest } from "@/app/types/category-template";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can import templates" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate the request
    if (!body.selections || !body.selections.categories) {
      return NextResponse.json(
        { error: "Invalid import request: selections are required" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const importRequest: ImportTemplateRequest = {
      templateId: id,
      importMode: body.importMode || "merge",
      selections: body.selections,
    };

    // Start the import process (returns job ID immediately)
    const jobId = await importTemplate(importRequest, orgId, userId);

    return NextResponse.json({
      jobId,
      message: "Import started successfully",
    });
  } catch (error) {
    console.error("Error importing template:", error);
    return NextResponse.json({ error: "Failed to import template" }, { status: 500 });
  }
}
