import { type Metadata } from "next";

import ServicesClient from "./components/ServicesClient";

export const metadata: Metadata = {
  title: "Services | Re-Infort",
  description: "Manage your service catalog and pricing",
};

export default function ServicesPage() {
  return <ServicesClient />;
}