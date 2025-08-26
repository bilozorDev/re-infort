import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { type Database } from "@/app/types/database.types";

type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    // Verify token and get quote
    const { data: tokenData, error: tokenError } = await supabase
      .from("quote_access_tokens")
      .select(`
        *,
        quote:quotes(
          *,
          client:clients(name, email, company),
          items:quote_items(*)
        )
      `)
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 404 });
    }

    // Get organization details
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name, email, phone, address")
      .eq("clerk_id", tokenData.organization_clerk_id)
      .single();

    // Format response
    const response = {
      id: tokenData.quote.id,
      quote_number: tokenData.quote.quote_number,
      status: tokenData.quote.status,
      created_at: tokenData.quote.created_at,
      valid_from: tokenData.quote.valid_from,
      valid_until: tokenData.quote.valid_until,
      subtotal: tokenData.quote.subtotal,
      discount_type: tokenData.quote.discount_type,
      discount_value: tokenData.quote.discount_value,
      discount_amount: tokenData.quote.discount_amount,
      tax_rate: tokenData.quote.tax_rate,
      tax_amount: tokenData.quote.tax_amount,
      total: tokenData.quote.total,
      terms_and_conditions: tokenData.quote.terms_and_conditions,
      notes: tokenData.quote.notes,
      client: {
        name: tokenData.quote.client.name,
        email: tokenData.quote.client.email,
        company: tokenData.quote.client.company,
      },
      items: tokenData.quote.items.map((item: QuoteItem) => ({
        id: item.id,
        type: item.item_type,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        subtotal: item.subtotal,
      })),
      organization: orgData || {
        name: "Organization",
        email: null,
        phone: null,
        address: null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/public/quote/[token]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}