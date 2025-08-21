import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { ProductDetailClient } from "./ProductDetailClient";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
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
    <ProductDetailClient 
      productId={params.id} 
      isAdmin={userIsAdmin} 
      organizationId={orgId} 
    />
  );
}