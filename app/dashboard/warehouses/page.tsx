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
    <WarehousesClient isAdmin={userIsAdmin} />
  );
}