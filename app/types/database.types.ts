export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          description: string | null
          id: string
          name: string
          organization_clerk_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name: string
          organization_clerk_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_clerk_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_templates: {
        Row: {
          business_type: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          business_type: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          business_type?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          created_by_clerk_user_id: string
          created_by_name: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_clerk_id: string
          phone: string | null
          postal_code: string | null
          state_province: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by_clerk_user_id: string
          created_by_name?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_clerk_id: string
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_clerk_id?: string
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_definitions: {
        Row: {
          category_id: string | null
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          display_order: number | null
          id: string
          input_type: string
          is_required: boolean | null
          name: string
          options: Json | null
          organization_clerk_id: string
          subcategory_id: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          display_order?: number | null
          id?: string
          input_type: string
          is_required?: boolean | null
          name: string
          options?: Json | null
          organization_clerk_id: string
          subcategory_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          display_order?: number | null
          id?: string
          input_type?: string
          is_required?: boolean | null
          name?: string
          options?: Json | null
          organization_clerk_id?: string
          subcategory_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_definitions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_definitions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          id: string
          location_details: string | null
          notes: string | null
          organization_clerk_id: string
          product_id: string
          quantity: number
          reserved_quantity: number
          since_date: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          id?: string
          location_details?: string | null
          notes?: string | null
          organization_clerk_id: string
          product_id: string
          quantity?: number
          reserved_quantity?: number
          since_date?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          id?: string
          location_details?: string | null
          notes?: string | null
          organization_clerk_id?: string
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          since_date?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          change_type: string
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          effective_date: string
          id: string
          new_cost: number | null
          new_price: number | null
          notes: string | null
          old_cost: number | null
          old_price: number | null
          organization_clerk_id: string
          product_id: string
          reason: string | null
        }
        Insert: {
          change_type: string
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          effective_date?: string
          id?: string
          new_cost?: number | null
          new_price?: number | null
          notes?: string | null
          old_cost?: number | null
          old_price?: number | null
          organization_clerk_id: string
          product_id: string
          reason?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          effective_date?: string
          id?: string
          new_cost?: number | null
          new_price?: number | null
          notes?: string | null
          old_cost?: number | null
          old_price?: number | null
          organization_clerk_id?: string
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          created_at: string
          feature_definition_id: string | null
          id: string
          is_custom: boolean | null
          name: string
          organization_clerk_id: string
          product_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          feature_definition_id?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          organization_clerk_id: string
          product_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          feature_definition_id?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          organization_clerk_id?: string
          product_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_features_feature_definition_id_fkey"
            columns: ["feature_definition_id"]
            isOneToOne: false
            referencedRelation: "feature_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost: number | null
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          description: string | null
          id: string
          link: string | null
          low_stock_threshold: number | null
          name: string
          organization_clerk_id: string
          photo_urls: string[] | null
          price: number | null
          serial_number: string | null
          sku: string
          status: string
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          link?: string | null
          low_stock_threshold?: number | null
          name: string
          organization_clerk_id: string
          photo_urls?: string[] | null
          price?: number | null
          serial_number?: string | null
          sku: string
          status?: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          link?: string | null
          low_stock_threshold?: number | null
          name?: string
          organization_clerk_id?: string
          photo_urls?: string[] | null
          price?: number | null
          serial_number?: string | null
          sku?: string
          status?: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_access_tokens: {
        Row: {
          created_at: string | null
          created_by_clerk_user_id: string
          expires_at: string
          id: string
          is_active: boolean | null
          last_viewed_at: string | null
          organization_clerk_id: string
          quote_id: string
          token: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by_clerk_user_id: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          organization_clerk_id: string
          quote_id: string
          token?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by_clerk_user_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          organization_clerk_id?: string
          quote_id?: string
          token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_access_tokens_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          organization_clerk_id: string
          quote_id: string
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          user_type: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          organization_clerk_id: string
          quote_id: string
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          user_type?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          organization_clerk_id?: string
          quote_id?: string
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_comments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_events: {
        Row: {
          created_at: string | null
          event_metadata: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          organization_clerk_id: string
          quote_id: string
          user_agent: string | null
          user_id: string | null
          user_name: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          event_metadata?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          organization_clerk_id: string
          quote_id: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          event_metadata?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          organization_clerk_id?: string
          quote_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          display_order: number | null
          id: string
          item_type: string
          name: string
          organization_clerk_id: string
          product_id: string | null
          quantity: number
          quote_id: string
          service_id: string | null
          sku: string | null
          subtotal: number
          total: number
          unit_price: number
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          display_order?: number | null
          id?: string
          item_type: string
          name: string
          organization_clerk_id: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          service_id?: string | null
          sku?: string | null
          subtotal?: number
          total?: number
          unit_price: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          display_order?: number | null
          id?: string
          item_type?: string
          name?: string
          organization_clerk_id?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          service_id?: string | null
          sku?: string | null
          subtotal?: number
          total?: number
          unit_price?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          assigned_to_clerk_user_id: string | null
          assigned_to_name: string | null
          client_id: string | null
          created_at: string | null
          created_by_clerk_user_id: string
          created_by_name: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          id: string
          internal_notes: string | null
          notes: string | null
          organization_clerk_id: string
          quote_number: string
          responded_at: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          terms_and_conditions: string | null
          total: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          assigned_to_clerk_user_id?: string | null
          assigned_to_name?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by_clerk_user_id: string
          created_by_name?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          organization_clerk_id: string
          quote_number: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          assigned_to_clerk_user_id?: string | null
          assigned_to_name?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          organization_clerk_id?: string
          quote_number?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          description: string | null
          id: string
          name: string
          organization_clerk_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name: string
          organization_clerk_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_clerk_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          created_by_clerk_user_id: string
          created_by_name: string | null
          description: string | null
          id: string
          name: string
          organization_clerk_id: string
          rate: number | null
          rate_type: string | null
          service_category_id: string | null
          status: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_clerk_user_id: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name: string
          organization_clerk_id: string
          rate?: number | null
          rate_type?: string | null
          service_category_id?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_clerk_id?: string
          rate?: number | null
          rate_type?: string | null
          service_category_id?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          from_warehouse_id: string | null
          id: string
          movement_type: string
          notes: string | null
          organization_clerk_id: string
          product_id: string
          quantity: number
          reason: string | null
          reference_number: string | null
          reference_type: string | null
          status: string
          to_warehouse_id: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          from_warehouse_id?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          organization_clerk_id: string
          product_id: string
          quantity: number
          reason?: string | null
          reference_number?: string | null
          reference_type?: string | null
          status?: string
          to_warehouse_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          from_warehouse_id?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          organization_clerk_id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_number?: string | null
          reference_type?: string | null
          status?: string
          to_warehouse_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          description: string | null
          id: string
          name: string
          organization_clerk_id: string
          status: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name: string
          organization_clerk_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_clerk_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      template_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          template_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_categories_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "category_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_features: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          input_type: string
          is_required: boolean | null
          name: string
          options: Json | null
          template_category_id: string | null
          template_subcategory_id: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          input_type: string
          is_required?: boolean | null
          name: string
          options?: Json | null
          template_category_id?: string | null
          template_subcategory_id?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          input_type?: string
          is_required?: boolean | null
          name?: string
          options?: Json | null
          template_category_id?: string | null
          template_subcategory_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_features_template_category_id_fkey"
            columns: ["template_category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_features_template_subcategory_id_fkey"
            columns: ["template_subcategory_id"]
            isOneToOne: false
            referencedRelation: "template_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      template_subcategories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          template_category_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          template_category_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          template_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_subcategories_template_category_id_fkey"
            columns: ["template_category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          feature_settings: Json | null
          id: string
          organization_clerk_id: string
          table_preferences: Json | null
          ui_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          feature_settings?: Json | null
          id?: string
          organization_clerk_id: string
          table_preferences?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          feature_settings?: Json | null
          id?: string
          organization_clerk_id?: string
          table_preferences?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          created_by_clerk_user_id: string
          created_by_name: string | null
          id: string
          is_default: boolean
          name: string
          notes: string | null
          organization_clerk_id: string
          postal_code: string
          state_province: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          created_by_clerk_user_id: string
          created_by_name?: string | null
          id?: string
          is_default?: boolean
          name: string
          notes?: string | null
          organization_clerk_id: string
          postal_code: string
          state_province: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          created_by_clerk_user_id?: string
          created_by_name?: string | null
          id?: string
          is_default?: boolean
          name?: string
          notes?: string | null
          organization_clerk_id?: string
          postal_code?: string
          state_province?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      inventory_details: {
        Row: {
          available_quantity: number | null
          category_id: string | null
          created_at: string | null
          created_by_clerk_user_id: string | null
          created_by_name: string | null
          id: string | null
          location_details: string | null
          notes: string | null
          organization_clerk_id: string | null
          product_cost: number | null
          product_id: string | null
          product_name: string | null
          product_price: number | null
          product_sku: string | null
          quantity: number | null
          reserved_quantity: number | null
          since_date: string | null
          subcategory_id: string | null
          updated_at: string | null
          warehouse_id: string | null
          warehouse_name: string | null
          warehouse_status: string | null
          warehouse_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history_details: {
        Row: {
          change_type: string | null
          created_at: string | null
          created_by_clerk_user_id: string | null
          created_by_name: string | null
          effective_date: string | null
          id: string | null
          new_cost: number | null
          new_price: number | null
          notes: string | null
          old_cost: number | null
          old_price: number | null
          organization_clerk_id: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          product_status: string | null
          reason: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements_details: {
        Row: {
          created_at: string | null
          created_by_clerk_user_id: string | null
          created_by_name: string | null
          display_status: string | null
          from_warehouse_id: string | null
          from_warehouse_name: string | null
          id: string | null
          movement_type: string | null
          notes: string | null
          organization_clerk_id: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          quantity: number | null
          reason: string | null
          reference_number: string | null
          reference_type: string | null
          status: string | null
          to_warehouse_id: string | null
          to_warehouse_name: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adjust_inventory: {
        Args:
          | {
              p_movement_type: string
              p_product_id: string
              p_quantity_change: number
              p_reason?: string
              p_reference_number?: string
              p_reference_type?: string
              p_user_name?: string
              p_warehouse_id: string
            }
          | {
              p_movement_type: string
              p_product_id: string
              p_quantity_change: number
              p_reason?: string
              p_reference_number?: string
              p_reference_type?: string
              p_warehouse_id: string
            }
        Returns: Json
      }
      batch_adjust_inventory: {
        Args: { p_adjustments: Json; p_user_id: string }
        Returns: Json
      }
      calculate_quote_totals: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
      complete_reservation: {
        Args: {
          p_movement_id: string
          p_notes?: string
          p_to_warehouse_id?: string
          p_user_name?: string
        }
        Returns: Json
      }
      convert_quote_to_sale: {
        Args: { p_quote_id: string; p_user_name?: string }
        Returns: Json
      }
      debug_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_quote_number: {
        Args: { p_org_id: string }
        Returns: string
      }
      get_org_id_from_path: {
        Args: { object_name: string }
        Returns: string
      }
      get_product_total_inventory: {
        Args: { p_product_id: string }
        Returns: {
          total_available: number
          total_quantity: number
          total_reserved: number
          warehouse_count: number
          warehouses: Json
        }[]
      }
      increment: {
        Args: { column_name: string; row_id: string; table_name: string }
        Returns: undefined
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      release_quote_reservations: {
        Args: { p_quote_id: string; p_reason?: string }
        Returns: Json
      }
      release_reservation: {
        Args:
          | { p_movement_id: string; p_reason?: string; p_user_name?: string }
          | { p_product_id: string; p_quantity: number; p_warehouse_id: string }
        Returns: Json
      }
      reserve_inventory: {
        Args:
          | {
              p_movement_type?: string
              p_product_id: string
              p_quantity: number
              p_reason?: string
              p_reference_number?: string
              p_user_name?: string
              p_warehouse_id: string
            }
          | {
              p_product_id: string
              p_quantity: number
              p_reference_number?: string
              p_warehouse_id: string
            }
        Returns: Json
      }
      reserve_quote_inventory: {
        Args: { p_quote_item_id: string; p_user_name?: string }
        Returns: Json
      }
      test_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_jwt: Json
          is_admin: boolean
          jwt_metadata: string
          org_role: string
        }[]
      }
      transfer_inventory: {
        Args:
          | {
              p_from_warehouse_id: string
              p_notes?: string
              p_product_id: string
              p_quantity: number
              p_reason?: string
              p_to_warehouse_id: string
            }
          | {
              p_from_warehouse_id: string
              p_notes?: string
              p_product_id: string
              p_quantity: number
              p_reason?: string
              p_to_warehouse_id: string
              p_user_name?: string
            }
        Returns: Json
      }
      update_table_preferences: {
        Args: { p_preferences: Json; p_table_key: string; p_user_id: string }
        Returns: Json
      }
      validate_batch_operation: {
        Args: { p_items: Json; p_operation_type: string }
        Returns: Json
      }
      verify_organization_access: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

