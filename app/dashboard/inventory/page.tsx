import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const orgId = await getCurrentOrgId();
  if (!orgId) {
    redirect("/onboarding/organization-selection");
  }

  const userIsAdmin = await isAdmin();

  return (
    <InventoryClient 
      isAdmin={userIsAdmin} 
      organizationId={orgId} 
    />
  );
}