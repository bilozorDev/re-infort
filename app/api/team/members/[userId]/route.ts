import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import type { UpdateRoleRequest } from "@/app/types/team";
import { isAdmin } from "@/app/utils/roles";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: currentUserId, orgId } = await auth();
    const { userId: targetUserId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only administrators can update user roles" },
        { status: 403 }
      );
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body: Pick<UpdateRoleRequest, "role"> = await request.json();
    const { role } = body;

    if (!role || !["org:admin", "org:member"].includes(role)) {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    const client = await clerkClient();

    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });

    const membership = memberships.data.find((m) => m.publicUserData?.userId === targetUserId);

    if (!membership) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    await client.organizations.updateOrganizationMembership({
      organizationId: orgId,
      userId: targetUserId,
      role: role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId, orgId } = await auth();
    const { userId: targetUserId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Only administrators can remove users" }, { status: 403 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId: targetUserId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
  }
}
