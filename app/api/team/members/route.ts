import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import type { OrganizationMember } from "@/app/types/team";

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
    const membershipsResponse = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });

    const members: OrganizationMember[] = await Promise.all(
      membershipsResponse.data.map(async (membership) => {
        const user = await client.users.getUser(membership.publicUserData?.userId || "");

        return {
          id: membership.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          role: membership.role as "org:admin" | "org:member",
          createdAt: new Date(membership.createdAt).toISOString(),
          userId: user.id,
        };
      })
    );

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
