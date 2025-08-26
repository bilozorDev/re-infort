"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Clock, Eye, FileText, Mail, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PageHeader } from "@/app/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import type { QuoteWithRelations } from "@/app/types/quotes-helpers";
import { formatCurrency } from "@/app/utils/formatters";

import QuoteBuilderForm from "./components/QuoteBuilderForm";

const statusVariants: Record<string, "default" | "blue" | "purple" | "success" | "destructive" | "warning" | "secondary"> = {
  draft: "secondary",
  sent: "blue",
  viewed: "purple",
  approved: "success",
  declined: "destructive",
  expired: "warning",
  converted: "success",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText className="h-4 w-4" />,
  sent: <Mail className="h-4 w-4" />,
  viewed: <Eye className="h-4 w-4" />,
  approved: <Check className="h-4 w-4" />,
  declined: <X className="h-4 w-4" />,
  expired: <Clock className="h-4 w-4" />,
  converted: <Check className="h-4 w-4" />,
};

export default function QuotesClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const { data: quotesData, isLoading } = useQuery({
    queryKey: ["quotes", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const response = await fetch(`/api/quotes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch quotes");
      return response.json();
    },
  });

  const quotes = quotesData?.data || [];

  const filteredQuotes = quotes.filter((quote: QuoteWithRelations) => {
    const matchesSearch =
      searchTerm === "" ||
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client?.company?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={statusVariants[status] || "default"} className="gap-1">
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (validUntil: string) => {
    const today = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Manage and track your quotes"
        primaryAction={{
          label: "New Quote",
          onClick: () => setShowQuoteForm(true),
          icon: Plus,
        }}
      />

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search quotes by number, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow-xs rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No quotes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote: QuoteWithRelations) => {
                  const daysUntilExpiry = getDaysUntilExpiry(quote.valid_until || new Date().toISOString());
                  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0 && quote.status === "sent";
                  
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.client?.name || "Unknown"}</div>
                          {quote.client?.company && (
                            <div className="text-sm text-gray-500">{quote.client.company}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status || "draft")}</TableCell>
                      <TableCell>
                        {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "N/A"}
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              {daysUntilExpiry}d left
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{quote.items?.length || 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(quote.total || 0)}
                      </TableCell>
                      <TableCell>{quote.assigned_to_name}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <QuoteBuilderForm
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
      />
    </div>
  );
}