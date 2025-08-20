import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getCurrentOrgId, isAdmin } from '@/app/utils/roles';

import { WarehousesClient } from './components/warehouses-client';

export default async function WarehousesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const orgId = await getCurrentOrgId();
  if (!orgId) {
    redirect('/onboarding/organization-selection');
  }

  const userIsAdmin = await isAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your inventory locations and warehouses
        </p>
      </div>
      
      <WarehousesClient isAdmin={userIsAdmin} />
    </div>
  );
}