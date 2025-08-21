import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  createFeatureDefinition,
  getFeatureDefinitions,
} from "@/app/lib/services/feature-definition.service";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const subcategoryId = searchParams.get("subcategoryId") || undefined;

    const featureDefinitions = await getFeatureDefinitions(orgId, categoryId, subcategoryId);

    return NextResponse.json(featureDefinitions);
  } catch (error) {
    console.error("Error fetching feature definitions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch feature definitions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create feature definitions" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const featureDefinition = await createFeatureDefinition(body, orgId, userId);

    return NextResponse.json(featureDefinition, { status: 201 });
  } catch (error) {
    console.error("Error creating feature definition:", error);
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to create feature definition" }, { status: 500 });
  }
}