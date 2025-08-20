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
          description: string | null
          display_order: number | null
          id: string
          name: string
          organization_clerk_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_clerk_user_id: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          organization_clerk_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_clerk_user_id?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          organization_clerk_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          created_by_clerk_user_id: string
          id: string
          location_details: string | null
          notes: string | null
          organization_clerk_id: string
          product_id: string
          quantity: number
          reorder_point: number | null
          reorder_quantity: number | null
          reserved_quantity: number
          since_date: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by_clerk_user_id: string
          id?: string
          location_details?: string | null
          notes?: string | null
          organization_clerk_id: string
          product_id: string
          quantity?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number
          since_date?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by_clerk_user_id?: string
          id?: string
          location_details?: string | null
          notes?: string | null
          organization_clerk_id?: string
          product_id?: string
          quantity?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
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
      products: {
        Row: {
          category_id: string | null
          cost: number | null
          created_at: string
          created_by_clerk_user_id: string
          description: string | null
          id: string
          link: string | null
          name: string
          organization_clerk_id: string
          photo_url: string | null
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
          description?: string | null
          id?: string
          link?: string | null
          name: string
          organization_clerk_id: string
          photo_url?: string | null
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
          description?: string | null
          id?: string
          link?: string | null
          name?: string
          organization_clerk_id?: string
          photo_url?: string | null
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
      stock_movements: {
        Row: {
          cancelled_at: string | null
          cancelled_by_clerk_user_id: string | null
          created_at: string
          created_by_clerk_user_id: string
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
          cancelled_at?: string | null
          cancelled_by_clerk_user_id?: string | null
          created_at?: string
          created_by_clerk_user_id: string
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
          cancelled_at?: string | null
          cancelled_by_clerk_user_id?: string | null
          created_at?: string
          created_by_clerk_user_id?: string
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
          description: string | null
          display_order: number | null
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
          description?: string | null
          display_order?: number | null
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
          description?: string | null
          display_order?: number | null
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
      warehouses: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          created_by_clerk_user_id: string
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
          reorder_point: number | null
          reorder_quantity: number | null
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
          cancelled_at: string | null
          cancelled_by_clerk_user_id: string | null
          created_at: string | null
          created_by_clerk_user_id: string | null
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
        Args: {
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
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      release_reservation: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_warehouse_id: string
        }
        Returns: Json
      }
      reserve_inventory: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_reference_number?: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      transfer_inventory: {
        Args: {
          p_from_warehouse_id: string
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_to_warehouse_id: string
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

