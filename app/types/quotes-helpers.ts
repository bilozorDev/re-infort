import type { Database } from "./database.types";

// Export the database types with shorter aliases
export type Tables = Database["public"]["Tables"];
export type Client = Tables["clients"]["Row"];
export type Service = Tables["services"]["Row"];
export type Quote = Tables["quotes"]["Row"];
export type QuoteItem = Tables["quote_items"]["Row"];
export type QuoteEvent = Tables["quote_events"]["Row"];
export type QuoteComment = Tables["quote_comments"]["Row"];

// Insert types
export type ClientInsert = Tables["clients"]["Insert"];
export type ServiceInsert = Tables["services"]["Insert"];
export type QuoteInsert = Tables["quotes"]["Insert"];
export type QuoteItemInsert = Tables["quote_items"]["Insert"];

// Update types
export type ClientUpdate = Tables["clients"]["Update"];
export type ServiceUpdate = Tables["services"]["Update"];
export type QuoteUpdate = Tables["quotes"]["Update"];
export type QuoteItemUpdate = Tables["quote_items"]["Update"];

// Extended types with relations
export interface QuoteWithRelations extends Quote {
  client?: Client;
  items?: QuoteItem[];
  events?: QuoteEvent[];
  comments?: QuoteComment[];
}

export interface QuoteItemWithRelations extends QuoteItem {
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

// Search result type (custom for the search endpoint)
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