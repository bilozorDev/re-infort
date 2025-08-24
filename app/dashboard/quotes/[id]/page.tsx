import QuoteDetails from "../components/QuoteDetails";

export default function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  return <QuoteDetails paramsPromise={params} />;
}