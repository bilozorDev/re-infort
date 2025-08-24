export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  rate_type: "hourly" | "fixed" | "custom";
  rate?: number | null;
  unit?: string | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  created_at: string;
  valid_from: string;
  valid_until: string;
  status: "draft" | "sent" | "viewed" | "approved" | "declined" | "expired" | "converted";
  subtotal: number;
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  terms_and_conditions?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  client_id: string;
  client?: Client;
  items?: QuoteItem[];
  events?: QuoteEvent[];
  comments?: QuoteComment[];
  created_by_name: string;
  assigned_to_name: string;
  created_by_clerk_user_id: string;
  assigned_to_clerk_user_id: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  type: "product" | "service" | "custom";
  product_id?: string | null;
  service_id?: string | null;
  warehouse_id?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    price?: number | null;
  };
  service?: {
    id: string;
    name: string;
    rate?: number | null;
    rate_type?: string | null;
    unit?: string | null;
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface QuoteEvent {
  id: string;
  quote_id: string;
  event_type: string;
  user_id?: string | null;
  user_type: "team" | "client";
  user_name: string;
  event_metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface QuoteComment {
  id: string;
  quote_id: string;
  user_id?: string | null;
  user_type: "team" | "client";
  user_name: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface SearchResult {
  id: string;
  type: "product" | "service";
  name: string;
  description?: string | null;
  sku?: string;
  price?: number | null;
  rate?: number | null;
  rate_type?: string | null;
  unit?: string | null;
  category?: string | null;
  subcategory?: string | null;
  availability?: {
    warehouse_id: string;
    warehouse_name: string;
    available_quantity: number;
    reserved_quantity: number;
  }[];
  photo_url?: string | null;
}