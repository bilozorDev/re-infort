"use client";

import { StockMovementsTable } from "@/app/components/inventory/StockMovementsTable";

interface MovementsTabProps {
  productId: string;
}

export function MovementsTab({ productId }: MovementsTabProps) {
  return <StockMovementsTable productId={productId} showProductColumn={false} />;
}
