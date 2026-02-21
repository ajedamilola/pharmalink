export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      buyback_requests: {
        Row: {
          admin_suggestion: boolean | null
          buyback_unit_price: number
          created_at: string
          drug_id: string
          expiry_date: string
          id: string
          original_unit_price: number
          pharmacy_id: string
          quantity: number
          remaining_shelf_pct: number | null
          status: Database["public"]["Enums"]["buyback_status"] | null
        }
        Insert: {
          admin_suggestion?: boolean | null
          buyback_unit_price: number
          created_at?: string
          drug_id: string
          expiry_date: string
          id?: string
          original_unit_price: number
          pharmacy_id: string
          quantity: number
          remaining_shelf_pct?: number | null
          status?: Database["public"]["Enums"]["buyback_status"] | null
        }
        Update: {
          admin_suggestion?: boolean | null
          buyback_unit_price?: number
          created_at?: string
          drug_id?: string
          expiry_date?: string
          id?: string
          original_unit_price?: number
          pharmacy_id?: string
          quantity?: number
          remaining_shelf_pct?: number | null
          status?: Database["public"]["Enums"]["buyback_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "buyback_requests_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyback_requests_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          issue_type: string
          order_id: string | null
          pharmacy_id: string
          status: Database["public"]["Enums"]["dispute_status"] | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          issue_type: string
          order_id?: string | null
          pharmacy_id: string
          status?: Database["public"]["Enums"]["dispute_status"] | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: string
          order_id?: string | null
          pharmacy_id?: string
          status?: Database["public"]["Enums"]["dispute_status"] | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          name: string
          pharmacy_id: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pharmacy_id: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pharmacy_id?: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      drugs: {
        Row: {
          category: string
          description: string | null
          id: string
          nafdac_number: string | null
          name: string
          shelf_life_months: number
          unit_price: number
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          nafdac_number?: string | null
          name: string
          shelf_life_months?: number
          unit_price: number
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          nafdac_number?: string | null
          name?: string
          shelf_life_months?: number
          unit_price?: number
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          created_at: string
          discount_pct: number | null
          drug_id: string
          id: string
          lead_time_days: number | null
          pharmacy_id: string | null
          quantity_available: number
          source: Database["public"]["Enums"]["order_source"] | null
          status: Database["public"]["Enums"]["listing_status"] | null
          unit_price: number
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          discount_pct?: number | null
          drug_id: string
          id?: string
          lead_time_days?: number | null
          pharmacy_id?: string | null
          quantity_available?: number
          source?: Database["public"]["Enums"]["order_source"] | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          unit_price: number
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          discount_pct?: number | null
          drug_id?: string
          id?: string
          lead_time_days?: number | null
          pharmacy_id?: string | null
          quantity_available?: number
          source?: Database["public"]["Enums"]["order_source"] | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          unit_price?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_logistics_cost: number | null
          created_at: string
          destination_location: string | null
          drug_id: string
          id: string
          logistics_fee: number | null
          logistics_partner: string | null
          pharmacy_id: string
          quantity: number
          source: Database["public"]["Enums"]["order_source"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          unit_price: number
          vendor_id: string | null
        }
        Insert: {
          actual_logistics_cost?: number | null
          created_at?: string
          destination_location?: string | null
          drug_id: string
          id?: string
          logistics_fee?: number | null
          logistics_partner?: string | null
          pharmacy_id: string
          quantity: number
          source?: Database["public"]["Enums"]["order_source"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          unit_price: number
          vendor_id?: string | null
        }
        Update: {
          actual_logistics_cost?: number | null
          created_at?: string
          destination_location?: string | null
          drug_id?: string
          id?: string
          logistics_fee?: number | null
          logistics_partner?: string | null
          pharmacy_id?: string
          quantity?: number
          source?: Database["public"]["Enums"]["order_source"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price?: number
          unit_price?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          account_status: string | null
          created_at: string
          direct_debit_enabled: boolean | null
          id: string
          location: string
          name: string
          pcn_license_status: string | null
          user_id: string
          wallet_balance: number | null
        }
        Insert: {
          account_status?: string | null
          created_at?: string
          direct_debit_enabled?: boolean | null
          id?: string
          location: string
          name: string
          pcn_license_status?: string | null
          user_id: string
          wallet_balance?: number | null
        }
        Update: {
          account_status?: string | null
          created_at?: string
          direct_debit_enabled?: boolean | null
          id?: string
          location?: string
          name?: string
          pcn_license_status?: string | null
          user_id?: string
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_inventory: {
        Row: {
          approval_mode: Database["public"]["Enums"]["approval_mode"] | null
          auto_restock: boolean | null
          batch_number: string
          created_at: string
          drug_id: string
          expiry_date: string
          id: string
          is_manual: boolean | null
          pharmacy_id: string
          reorder_quantity: number | null
          reorder_threshold: number
          stock_level: number
          vendor_id: string | null
        }
        Insert: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"] | null
          auto_restock?: boolean | null
          batch_number: string
          created_at?: string
          drug_id: string
          expiry_date: string
          id?: string
          is_manual?: boolean | null
          pharmacy_id: string
          reorder_quantity?: number | null
          reorder_threshold?: number
          stock_level?: number
          vendor_id?: string | null
        }
        Update: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"] | null
          auto_restock?: boolean | null
          batch_number?: string
          created_at?: string
          drug_id?: string
          expiry_date?: string
          id?: string
          is_manual?: boolean | null
          pharmacy_id?: string
          reorder_quantity?: number | null
          reorder_threshold?: number
          stock_level?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_inventory_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          created_at: string
          id: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      pos_sales: {
        Row: {
          created_at: string
          customer_name: string | null
          drug_id: string
          id: string
          inventory_item_id: string
          pharmacy_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          drug_id: string
          id?: string
          inventory_item_id: string
          pharmacy_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          drug_id?: string
          id?: string
          inventory_item_id?: string
          pharmacy_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          created_at: string
          drug_id: string
          id: string
          pharmacy_id: string
          quantity: number
          total_price: number
          trigger: Database["public"]["Enums"]["po_trigger"] | null
          unit_price: number
          vendor_id: string | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          created_at?: string
          drug_id: string
          id?: string
          pharmacy_id: string
          quantity: number
          total_price: number
          trigger?: Database["public"]["Enums"]["po_trigger"] | null
          unit_price: number
          vendor_id?: string | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          created_at?: string
          drug_id?: string
          id?: string
          pharmacy_id?: string
          quantity?: number
          total_price?: number
          trigger?: Database["public"]["Enums"]["po_trigger"] | null
          unit_price?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          pharmacy_id: string
          reference: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          pharmacy_id: string
          reference?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          pharmacy_id?: string
          reference?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      vendor_products: {
        Row: {
          created_at: string
          drug_id: string
          id: string
          image_url: string | null
          lead_time_days: number | null
          moq: number | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_available: number
          unit_price: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          drug_id: string
          id?: string
          image_url?: string | null
          lead_time_days?: number | null
          moq?: number | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_available?: number
          unit_price: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          drug_id?: string
          id?: string
          image_url?: string | null
          lead_time_days?: number | null
          moq?: number | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_available?: number
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          cac_status: string | null
          created_at: string
          id: string
          license_status: string | null
          location: string
          nafdac_status: string | null
          name: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          cac_status?: string | null
          created_at?: string
          id?: string
          license_status?: string | null
          location: string
          nafdac_status?: string | null
          name: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          cac_status?: string | null
          created_at?: string
          id?: string
          license_status?: string | null
          location?: string
          nafdac_status?: string | null
          name?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_role: {
        Args: { _auth_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      approval_mode: "auto" | "manual"
      approval_status: "pending" | "approved" | "fulfilled"
      buyback_status:
        | "pending"
        | "admin_approved"
        | "vendor_matched"
        | "completed"
        | "declined"
      dispute_status: "open" | "resolved" | "escalated"
      document_type:
        | "invoice"
        | "purchase_order"
        | "buyback_receipt"
        | "statement"
      listing_status: "active" | "sold"
      notification_type:
        | "system"
        | "admin_suggestion"
        | "order"
        | "restock"
        | "buyback"
      order_source: "vendor" | "buyback"
      order_status:
        | "pending"
        | "processing"
        | "dispatched"
        | "delivered"
        | "confirmed"
        | "shipped"
        | "in_transit"
        | "out_for_delivery"
      po_trigger: "auto" | "manual"
      product_status: "active" | "inactive"
      transaction_type: "debit" | "credit"
      user_role: "pharmacy" | "vendor" | "admin"
      verification_status: "pending" | "verified" | "rejected"
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
  public: {
    Enums: {
      approval_mode: ["auto", "manual"],
      approval_status: ["pending", "approved", "fulfilled"],
      buyback_status: [
        "pending",
        "admin_approved",
        "vendor_matched",
        "completed",
        "declined",
      ],
      dispute_status: ["open", "resolved", "escalated"],
      document_type: [
        "invoice",
        "purchase_order",
        "buyback_receipt",
        "statement",
      ],
      listing_status: ["active", "sold"],
      notification_type: [
        "system",
        "admin_suggestion",
        "order",
        "restock",
        "buyback",
      ],
      order_source: ["vendor", "buyback"],
      order_status: [
        "pending",
        "processing",
        "dispatched",
        "delivered",
        "confirmed",
        "shipped",
        "in_transit",
        "out_for_delivery",
      ],
      po_trigger: ["auto", "manual"],
      product_status: ["active", "inactive"],
      transaction_type: ["debit", "credit"],
      user_role: ["pharmacy", "vendor", "admin"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
