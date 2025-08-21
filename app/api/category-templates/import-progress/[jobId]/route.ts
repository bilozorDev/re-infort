import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { cancelImport, getImportProgress } from "@/app/lib/services/category-template.service";

interface RouteParams {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const progress = await getImportProgress(jobId);

    if (!progress) {
      return NextResponse.json({ error: "Import job not found" }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching import progress:", error);
    return NextResponse.json({ error: "Failed to fetch import progress" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const cancelled = await cancelImport(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: "Import job not found or already completed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Import cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling import:", error);
    return NextResponse.json({ error: "Failed to cancel import" }, { status: 500 });
  }
}
