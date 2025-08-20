import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OrganizationProfile } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Company Settings',
  description: 'Manage your organization settings',
};

export default async function CompanyInfoPage() {
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!orgId) {
    redirect('/onboarding/organization-selection');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization details and team members
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Welcome, {user?.firstName || 'User'}!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your organization has been created successfully. You can manage settings below.
            </p>
          </div>
        </div>

        <OrganizationProfile 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0",
            }
          }}
        />
      </div>
    </div>
  );
}