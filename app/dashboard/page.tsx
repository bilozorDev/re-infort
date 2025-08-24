import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/ui/page-header";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/onboarding/organization-selection");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to your inventory management dashboard"
      />
      {/* Dashboard content will go here */}
    </div>
  );
}
