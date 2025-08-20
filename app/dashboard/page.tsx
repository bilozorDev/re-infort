import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId, orgId, orgSlug } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/onboarding/organization-selection");
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <OrganizationSwitcher 
            appearance={{
              elements: {
                rootBox: "flex items-center",
              }
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings/company-info"
            className="text-sm font-medium hover:text-gray-600 transition-colors"
          >
            Settings
          </Link>
          <UserButton />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Welcome back, <span className="font-semibold">{user?.firstName || 'User'}</span>! 
            You're working in organization: <span className="font-semibold">{orgSlug}</span>
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Organization</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You're successfully connected to your organization.
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Supabase Ready</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your Supabase client is configured and ready to use.
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start building your application features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}