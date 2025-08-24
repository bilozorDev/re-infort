"use client";

import { format } from "date-fns";
import {
  Calendar,
  Check,
  Clock,
  FileText,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import { useEffect,useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { formatCurrency } from "@/app/utils/formatters";

interface PublicQuoteViewProps {
  paramsPromise: Promise<{ token: string }>;
}

interface QuoteData {
  id: string;
  quote_number: string;
  status: string;
  created_at: string;
  valid_from: string;
  valid_until: string;
  subtotal: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  terms_and_conditions?: string;
  notes?: string;
  client: {
    name: string;
    email: string;
    company?: string;
  };
  items: Array<{
    id: string;
    type: string;
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    discount_type?: string;
    discount_value?: number;
    subtotal: number;
  }>;
  organization: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export default function PublicQuoteView({ paramsPromise }: PublicQuoteViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    paramsPromise.then((params) => {
      setToken(params.token);
      fetchQuote(params.token);
    });
  }, [paramsPromise]);

  const fetchQuote = async (accessToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/quote/${accessToken}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Quote not found or link has expired");
        } else {
          setError("Failed to load quote");
        }
        return;
      }

      const data = await response.json();
      setQuote(data);

      // Mark as viewed if it's the first time
      if (data.status === "sent") {
        await fetch(`/api/public/quote/${accessToken}/view`, {
          method: "POST",
        });
      }
    } catch (err) {
      console.error("Error fetching quote:", err);
      setError("Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/quote/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) throw new Error("Failed to approve quote");

      toast.success("Quote approved successfully!");
      await fetchQuote(token);
    } catch {
      toast.error("Failed to approve quote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token || !comment.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/quote/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) throw new Error("Failed to decline quote");

      toast.success("Quote declined");
      await fetchQuote(token);
    } catch {
      toast.error("Failed to decline quote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!token || !comment.trim()) {
      toast.error("Please specify what changes are needed");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/quote/${token}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) throw new Error("Failed to submit comment");

      toast.success("Your feedback has been sent");
      setComment("");
      await fetchQuote(token);
    } catch {
      toast.error("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Quote Not Available</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(quote.valid_until);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry < 0;
  const canTakeAction = ["sent", "viewed"].includes(quote.status) && !isExpired;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quote {quote.quote_number}
              </h1>
              <p className="text-gray-600 mt-1">
                From {quote.organization.name}
              </p>
            </div>
            <div className="text-right">
              <Badge className={`${getStatusColor(quote.status)} border-0`}>
                {quote.status === "viewed" ? "Pending" : quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </Badge>
              {isExpired && quote.status !== "approved" && quote.status !== "declined" && (
                <Badge variant="outline" className="ml-2 text-orange-600 border-orange-600">
                  Expired
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="h-4 w-4" />
                For
              </div>
              <p className="font-medium">{quote.client.name}</p>
              {quote.client.company && (
                <p className="text-gray-600">{quote.client.company}</p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="h-4 w-4" />
                Valid Until
              </div>
              <p className="font-medium">
                {format(new Date(quote.valid_until), "PPP")}
              </p>
              {!isExpired && daysUntilExpiry <= 7 && (
                <p className="text-orange-600 text-xs">
                  {daysUntilExpiry} days remaining
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                Created
              </div>
              <p className="font-medium">
                {format(new Date(quote.created_at), "PPP")}
              </p>
            </div>
          </div>
        </div>

        {/* Quote Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.items.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span>@ {formatCurrency(item.unit_price)}</span>
                        {item.discount_value && item.discount_value > 0 && (
                          <Badge variant="outline" className="text-green-600">
                            {item.discount_type === "percentage"
                              ? `${item.discount_value}% off`
                              : `${formatCurrency(item.discount_value)} off`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
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
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Notes */}
        {(quote.terms_and_conditions || quote.notes) && (
          <Card className="mb-6">
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

        {/* Actions */}
        {canTakeAction && (
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comments or Feedback (Optional)
                </label>
                <Textarea
                  placeholder="Add any comments, questions, or feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRequestChanges}
                  disabled={submitting || !comment.trim()}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Request Changes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={handleDecline}
                  disabled={submitting || !comment.trim()}
                >
                  <X className="mr-2 h-4 w-4" />
                  Decline Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {quote.status === "approved" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Quote Approved</h3>
                <p className="text-gray-600">
                  This quote has been approved. We&apos;ll be in touch shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {quote.status === "declined" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Quote Declined</h3>
                <p className="text-gray-600">
                  This quote has been declined. Please contact us if you have any questions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isExpired && quote.status !== "approved" && quote.status !== "declined" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Quote Expired</h3>
                <p className="text-gray-600">
                  This quote has expired. Please contact us for an updated quote.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            Questions? Contact {quote.organization.name}
            {quote.organization.email && (
              <> at <a href={`mailto:${quote.organization.email}`} className="text-blue-600 hover:underline">{quote.organization.email}</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}