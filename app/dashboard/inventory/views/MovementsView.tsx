"use client";

import { StockMovementsTable } from "@/app/components/inventory/StockMovementsTable";

interface MovementsViewProps {
  isAdmin: boolean;
}

export function MovementsView({}: MovementsViewProps) {
  return <StockMovementsTable showProductColumn={true} />;
}