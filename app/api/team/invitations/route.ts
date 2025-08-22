import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import type { InviteUserRequest, OrganizationInvitation } from "@/app/types/team";
import { isAdmin } from "@/app/utils/roles";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const client = await clerkClient();
    const invitationsResponse = await client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
      limit: 100,
    });

    const invitations: OrganizationInvitation[] = invitationsResponse.data.map((invitation) => ({
      id: invitation.id,
      email: invitation.emailAddress,
      role: invitation.role as "org:admin" | "org:member",
      status: invitation.status as "pending" | "accepted" | "revoked",
      createdAt: new Date(invitation.createdAt).toISOString(),
      expiresAt: new Date(invitation.createdAt + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Only administrators can invite users" }, { status: 403 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body: InviteUserRequest = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const client = await clerkClient();
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: role,
      inviterUserId: userId,
    });

    const response: OrganizationInvitation = {
      id: invitation.id,
      email: invitation.emailAddress,
      role: invitation.role as "org:admin" | "org:member",
      status: invitation.status as "pending" | "accepted" | "revoked",
      createdAt: new Date(invitation.createdAt).toISOString(),
      expiresAt: new Date(invitation.createdAt + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
