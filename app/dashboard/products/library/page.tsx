import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { TemplateLibraryClient } from "./TemplateLibraryClient";

export default async function TemplateLibraryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const orgId = await getCurrentOrgId();
  if (!orgId) {
    redirect("/onboarding/organization-selection");
  }

  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect("/dashboard/products/categories");
  }

  return <TemplateLibraryClient />;
}