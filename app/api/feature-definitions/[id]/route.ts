import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  deleteFeatureDefinition,
  getFeatureDefinitionById,
  updateFeatureDefinition,
} from "@/app/lib/services/feature-definition.service";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const featureDefinition = await getFeatureDefinitionById(id, orgId);

    if (!featureDefinition) {
      return NextResponse.json({ error: "Feature definition not found" }, { status: 404 });
    }

    return NextResponse.json(featureDefinition);
  } catch (error) {
    console.error("Error fetching feature definition:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch feature definition" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update feature definitions" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const featureDefinition = await updateFeatureDefinition(id, body, orgId);

    return NextResponse.json(featureDefinition);
  } catch (error) {
    console.error("Error updating feature definition:", error);
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update feature definition" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete feature definitions" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await deleteFeatureDefinition(id, orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feature definition:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete feature definition" },
      { status: 500 }
    );
  }
}