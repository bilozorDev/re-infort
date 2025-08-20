import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const orgId = await getCurrentOrgId();
  if (!orgId) {
    redirect("/onboarding/organization-selection");
  }

  const userIsAdmin = await isAdmin();

  return <CategoriesClient isAdmin={userIsAdmin} />;
}