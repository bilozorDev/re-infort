import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  getProductFeatures,
  upsertProductFeatures,
} from "@/app/lib/services/product-features.service";
import { getCurrentOrgId } from "@/app/utils/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const features = await getProductFeatures(params.id, orgId);

    return NextResponse.json(features);
  } catch (error) {
    console.error("Error fetching product features:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch product features" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const features = await upsertProductFeatures(params.id, body.features || [], orgId);

    return NextResponse.json(features);
  } catch (error) {
    console.error("Error updating product features:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product features" },
      { status: 500 }
    );
  }
}