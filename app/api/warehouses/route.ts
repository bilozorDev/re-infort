import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createWarehouse, getAllWarehouses } from "@/app/lib/services/warehouse.service";
import { createWarehouseSchema } from "@/app/lib/validations/warehouse";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

// GET /api/warehouses - Get all warehouses for the organization
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

    const warehouses = await getAllWarehouses(orgId);
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}

// POST /api/warehouses - Create a new warehouse
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create warehouses" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = createWarehouseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const warehouse = await createWarehouse(validationResult.data, orgId, userId);
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create warehouse";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
