"use client";

import { useMutation,useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  Edit2,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Package,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { PageHeader } from "@/app/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { type QuoteComment, type QuoteEvent } from "@/app/types/quotes-helpers";
import { formatCurrency } from "@/app/utils/formatters";

import QuoteItemsList from "./QuoteItemsList";

interface QuoteDetailsProps {
  paramsPromise: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
  converted: "bg-emerald-100 text-emerald-800",
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

export default function QuoteDetails({ paramsPromise }: QuoteDetailsProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  const { data: quote, isLoading, refetch } = useQuery({
    queryKey: ["quote", params?.id],
    queryFn: async () => {
      if (!params?.id) return null;
      const response = await fetch(`/api/quotes/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch quote");
      return response.json();
    },
    enabled: !!params?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/quotes/${params?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast.success("Quote status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/quotes/${params?.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to send quote");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast.success("Quote sent successfully");
    },
    onError: () => {
      toast.error("Failed to send quote");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const response = await fetch(`/api/quotes/${params?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, is_internal: true }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setNewComment("");
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/quotes/${params?.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quote");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Quote deleted");
      router.push("/dashboard/quotes");
    },
    onError: () => {
      toast.error("Failed to delete quote");
    },
  });

  if (!params?.id) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p>Quote not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/quotes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quotes
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${statusColors[status]} border-0 gap-1`}>
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(quote.valid_until);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry < 0 && quote.status === "sent";

  // Build custom actions for PageHeader
  const customActions = (
    <div className="flex gap-2">
      {quote.status === "draft" && (
        <>
          <Button
            onClick={() => sendQuoteMutation.mutate()}
            disabled={sendQuoteMutation.isPending}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Quote
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/quotes/${params.id}/edit`)}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </>
      )}
      {quote.status === "sent" && (
        <Button
          variant="outline"
          onClick={() => sendQuoteMutation.mutate()}
          disabled={sendQuoteMutation.isPending}
        >
          <Mail className="mr-2 h-4 w-4" />
          Resend
        </Button>
      )}
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button variant="outline">
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </Button>
      {quote.status === "draft" && (
        <Button
          variant="outline"
          className="text-red-600 hover:text-red-700"
          onClick={() => {
            if (confirm("Are you sure you want to delete this quote?")) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.quote_number}
        backLink={{
          label: "Back to Quotes",
          href: "/dashboard/quotes",
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {getStatusBadge(quote.status)}
            {isExpired && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Expired
              </Badge>
            )}
          </div>
          {customActions}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              {quote.client ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User className="h-4 w-4" />
                      Contact Name
                    </div>
                    <p className="font-medium">{quote.client.name || "N/A"}</p>
                  </div>
                  {quote.client.company && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Building className="h-4 w-4" />
                        Company
                      </div>
                      <p className="font-medium">{quote.client.company}</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="font-medium">{quote.client.email || "N/A"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      Valid Until
                    </div>
                    <p className="font-medium">
                      {format(new Date(quote.valid_until), "PPP")}
                      {daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
                        <span className="text-orange-600 text-sm ml-2">
                          ({daysUntilExpiry} days left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No client information available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent>
              {quote.items && quote.items.length > 0 ? (
                <QuoteItemsList
                  items={quote.items}
                  onUpdateItem={() => {}}
                  onRemoveItem={() => {}}
                  readonly={true}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No items added to this quote yet
                </p>
              )}
            </CardContent>
          </Card>

          {(quote.terms_and_conditions || quote.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.terms_and_conditions && (
                  <div>
                    <h4 className="font-medium mb-2">Terms and Conditions</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {quote.terms_and_conditions}
                    </p>
                  </div>
                )}
                {quote.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {quote.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal || 0)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount
                    {quote.discount_type === "percentage" &&
                      ` (${quote.discount_value}%)`}
                  </span>
                  <span>-{formatCurrency(quote.discount_amount)}</span>
                </div>
              )}
              {quote.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({quote.tax_rate}%)</span>
                  <span>{formatCurrency(quote.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(quote.total || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{quote.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{quote.assigned_to_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created On</p>
                <p className="font-medium">
                  {format(new Date(quote.created_at), "PPP")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valid From</p>
                <p className="font-medium">
                  {format(new Date(quote.valid_from), "PPP")}
                </p>
              </div>
            </CardContent>
          </Card>

          {quote.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {quote.internal_notes}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quote.status === "sent" && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate("approved")}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Approved
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate("declined")}
                    disabled={updateStatusMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark as Declined
                  </Button>
                </>
              )}
              {quote.status === "approved" && (
                <Button
                  className="w-full"
                  onClick={() => updateStatusMutation.mutate("converted")}
                  disabled={updateStatusMutation.isPending}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Convert to Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {quote.events && quote.events.length > 0 ? (
                <div className="space-y-4">
                  {quote.events.map((event: QuoteEvent) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.user_name}</span>
                          <span className="text-sm text-gray-500">
                            {event.event_type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {event.created_at ? format(new Date(event.created_at), "PPp") : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No activity yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.comments && quote.comments.length > 0 && (
                  <div className="space-y-3">
                    {quote.comments.map((comment: QuoteComment) => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{comment.user_name}</span>
                          <span className="text-sm text-gray-500">
                            {comment.created_at ? format(new Date(comment.created_at), "PPp") : "N/A"}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => {
                      if (newComment.trim()) {
                        addCommentMutation.mutate(newComment);
                      }
                    }}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}