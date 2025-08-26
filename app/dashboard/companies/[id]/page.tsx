import CompanyDetailsClient from "./components/CompanyDetailsClient";

interface CompanyDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyDetailsPage({ params }: CompanyDetailsPageProps) {
  const { id } = await params;
  return <CompanyDetailsClient companyId={id} />;
}