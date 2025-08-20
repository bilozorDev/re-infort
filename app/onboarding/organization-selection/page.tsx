import { OrganizationList } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Select Organization',
  description: 'Select or create an organization to continue',
};

export default function OrganizationSelectionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Select Your Organization</h1>
          <p className="text-gray-600">
            Choose an existing organization or create a new one to get started
          </p>
        </div>
        
        <OrganizationList
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          hidePersonal
          appearance={{
            elements: {
              rootBox: "flex justify-center",
              organizationList: "flex justify-center",
            }
          }}
        />
      </div>
    </div>
  );
}