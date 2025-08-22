import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  deleteWarehouse,
  getWarehouseById,
  updateWarehouse,
} from "@/app/lib/services/warehouse.service";
import { updateWarehouseSchema } from "@/app/lib/validations/warehouse";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

// GET /api/warehouses/[id] - Get a single warehouse
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await params;
    const warehouse = await getWarehouseById(id, orgId);
    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    return NextResponse.json({ error: "Failed to fetch warehouse" }, { status: 500 });
  }
}

// PUT /api/warehouses/[id] - Update a warehouse
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update warehouses" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateWarehouseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await params;
    const warehouse = await updateWarehouse(id, validationResult.data, orgId);
    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error updating warehouse:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update warehouse";

    if (errorMessage.includes("not found")) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/warehouses/[id] - Delete a warehouse
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete warehouses" },
        { status: 403 }
      );
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { id } = await params;

    // TODO: Check if warehouse has any products before allowing deletion
    // const productCount = await getProductCountByWarehouse(id, orgId);
    // if (productCount > 0) {
    //   return NextResponse.json(
    //     { error: `Cannot delete warehouse with ${productCount} products. Please reassign or remove products first.` },
    //     { status: 400 }
    //   );
    // }

    await deleteWarehouse(id, orgId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
  }
}
