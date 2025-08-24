import PublicQuoteView from "./PublicQuoteView";

export default function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  return <PublicQuoteView paramsPromise={params} />;
}