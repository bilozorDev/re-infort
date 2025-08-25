import CompanyDetailsClient from "./components/CompanyDetailsClient";

interface CompanyDetailsPageProps {
  params: {
    id: string;
  };
}

export default function CompanyDetailsPage({ params }: CompanyDetailsPageProps) {
  return <CompanyDetailsClient companyId={params.id} />;
}