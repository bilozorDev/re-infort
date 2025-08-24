import { type Metadata } from "next";

import ClientsClient from "./components/ClientsClient";

export const metadata: Metadata = {
  title: "Clients | Re-Infort",
  description: "Manage your clients and customers",
};

export default function ClientsPage() {
  return <ClientsClient />;
}