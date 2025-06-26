export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string | null
          id: number
          item_id: number
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string | null
          id?: number
          item_id: number
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string | null
          id?: number
          item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: never
          name: string
          slug: string
        }
        Update: {
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: number
          image_urls: string[] | null
          is_read: boolean | null
          message: string
          recipient_id: string
          room_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_urls?: string[] | null
          is_read?: boolean | null
          message: string
          recipient_id: string
          room_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          image_urls?: string[] | null
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      constants: {
        Row: {
          COMMISSION_RATE: number
          FEATURE_FEE: number
          id: number
          LISTING_FEE: number
          PURCHASE_FEE: number
        }
        Insert: {
          COMMISSION_RATE: number
          FEATURE_FEE: number
          id: number
          LISTING_FEE: number
          PURCHASE_FEE: number
        }
        Update: {
          COMMISSION_RATE?: number
          FEATURE_FEE?: number
          id?: number
          LISTING_FEE?: number
          PURCHASE_FEE?: number
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          bonus_credits: number | null
          created_at: string | null
          credits_amount: number
          description: string | null
          features: string[] | null
          id: number
          is_popular: boolean | null
          name: string
          price_zar: number
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string | null
          credits_amount: number
          description?: string | null
          features?: string[] | null
          id?: number
          is_popular?: boolean | null
          name: string
          price_zar: number
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string | null
          credits_amount?: number
          description?: string | null
          features?: string[] | null
          id?: number
          is_popular?: boolean | null
          name?: string
          price_zar?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: number
          profile_id: string
          transaction_type:
            | Database["public"]["Enums"]["credit_transaction_type"]
            | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: number
          profile_id: string
          transaction_type?:
            | Database["public"]["Enums"]["credit_transaction_type"]
            | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: number
          profile_id?: string
          transaction_type?:
            | Database["public"]["Enums"]["credit_transaction_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          order_id: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          order_id?: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          order_id?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reports: {
        Row: {
          agent_id: string
          created_at: string | null
          id: number
          image_urls: string[] | null
          order_id: number
          report_text: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: number
          image_urls?: string[] | null
          order_id: number
          report_text?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: number
          image_urls?: string[] | null
          order_id?: number
          report_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          buy_now_price: number | null
          category: string | null
          category_id: number | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string | null
          description: string | null
          fts: unknown | null
          id: number
          images: Json[] | null
          is_featured: boolean | null
          latitude: number | null
          location_description: string | null
          longitude: number | null
          seller_id: string
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          buy_now_price?: number | null
          category?: string | null
          category_id?: number | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at?: string | null
          description?: string | null
          fts?: unknown | null
          id?: number
          images?: Json[] | null
          is_featured?: boolean | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          seller_id: string
          status?: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          buy_now_price?: number | null
          category?: string | null
          category_id?: number | null
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string | null
          description?: string | null
          fts?: unknown | null
          id?: number
          images?: Json[] | null
          is_featured?: boolean | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          seller_id?: string
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean
          link_url: string | null
          message: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean
          link_url?: string | null
          message: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean
          link_url?: string | null
          message?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: number
          item_id: number
          last_offer_by: string | null
          offer_amount: number
          order_id: number | null
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: never
          item_id: number
          last_offer_by?: string | null
          offer_amount: number
          order_id?: number | null
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: never
          item_id?: number
          last_offer_by?: string | null
          offer_amount?: number
          order_id?: number | null
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_last_offer_by_fkey"
            columns: ["last_offer_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_id: string | null
          buyer_id: string
          collection_fee_paid: number
          created_at: string | null
          created_from_offer_id: number | null
          delivery_fee_paid: number
          final_amount: number
          id: number
          inspection_fee_paid: number
          item_id: number
          paystack_ref: string | null
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          buyer_id: string
          collection_fee_paid?: number
          created_at?: string | null
          created_from_offer_id?: number | null
          delivery_fee_paid?: number
          final_amount: number
          id?: number
          inspection_fee_paid?: number
          item_id: number
          paystack_ref?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          buyer_id?: string
          collection_fee_paid?: number
          created_at?: string | null
          created_from_offer_id?: number | null
          delivery_fee_paid?: number
          final_amount?: number
          id?: number
          inspection_fee_paid?: number
          item_id?: number
          paystack_ref?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_from_offer_id_fkey"
            columns: ["created_from_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          avatar_url: string | null
          average_rating: number | null
          company_name: string | null
          company_registration: string | null
          created_at: string | null
          credit_balance: number
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type_enum"]
          avatar_url?: string | null
          average_rating?: number | null
          company_name?: string | null
          company_registration?: string | null
          created_at?: string | null
          credit_balance?: number
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type_enum"]
          avatar_url?: string | null
          average_rating?: number | null
          company_name?: string | null
          company_registration?: string | null
          created_at?: string | null
          credit_balance?: number
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          order_id: number
          rating: number
          reviewer_id: string
          seller_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: never
          order_id: number
          rating: number
          reviewer_id: string
          seller_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: never
          order_id?: number
          rating?: number
          reviewer_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_offer_and_create_order: {
        Args: { p_offer_id: number }
        Returns: {
          id: number
        }[]
      }
      add_credits_to_user: {
        Args: { user_id: string; amount_to_add: number }
        Returns: undefined
      }
      adjust_user_credits: {
        Args: {
          p_user_id: string
          p_amount_to_adjust: number
          p_admin_notes: string
        }
        Returns: undefined
      }
      create_new_notification: {
        Args: { p_profile_id: string; p_message: string; p_link_url: string }
        Returns: undefined
      }
      deduct_listing_fee: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      deduct_purchase_fee: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      execute_seller_payout: {
        Args: { p_order_id: number }
        Returns: {
          agent_id: string | null
          buyer_id: string
          collection_fee_paid: number
          created_at: string | null
          created_from_offer_id: number | null
          delivery_fee_paid: number
          final_amount: number
          id: number
          inspection_fee_paid: number
          item_id: number
          paystack_ref: string | null
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string | null
        }[]
      }
      get_dashboard_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_conversations: {
        Args: { p_user_id: string }
        Returns: {
          room_id: string
          last_message: string
          last_message_at: string
          is_last_message_read: boolean
          other_user: Json
          item: Json
        }[]
      }
      increment_view_count: {
        Args:
          | { item_id_to_increment: number }
          | { item_id_to_increment: number }
        Returns: undefined
      }
      process_order_payment: {
        Args: { p_order_id: number; p_buyer_id: string; p_paystack_ref: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type_enum: "individual" | "business"
      credit_transaction_type:
        | "purchase"
        | "listing_fee"
        | "purchase_fee"
        | "refund"
        | "admin_grant"
        | "feature_fee"
      item_condition: "new" | "like_new" | "used_good" | "used_fair"
      item_status: "available" | "sold" | "pending_payment"
      order_status:
        | "pending_payment"
        | "payment_authorized"
        | "inspection_pending"
        | "completed"
        | "cancelled"
        | "disputed"
        | "awaiting_collection"
        | "in_warehouse"
        | "inspection_passed"
        | "inspection_failed"
        | "out_for_delivery"
        | "awaiting_assessment"
        | "pending_admin_approval"
        | "item_collected"
        | "delivered"
      transaction_status: "pending" | "completed" | "failed"
      transaction_type:
        | "sale"
        | "commission"
        | "payout"
        | "credit_purchase"
        | "listing_fee"
        | "purchase_fee"
      user_role: "user" | "agent" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type_enum: ["individual", "business"],
      credit_transaction_type: [
        "purchase",
        "listing_fee",
        "purchase_fee",
        "refund",
        "admin_grant",
        "feature_fee",
      ],
      item_condition: ["new", "like_new", "used_good", "used_fair"],
      item_status: ["available", "sold", "pending_payment"],
      order_status: [
        "pending_payment",
        "payment_authorized",
        "inspection_pending",
        "completed",
        "cancelled",
        "disputed",
        "awaiting_collection",
        "in_warehouse",
        "inspection_passed",
        "inspection_failed",
        "out_for_delivery",
        "awaiting_assessment",
        "pending_admin_approval",
        "item_collected",
        "delivered",
      ],
      transaction_status: ["pending", "completed", "failed"],
      transaction_type: [
        "sale",
        "commission",
        "payout",
        "credit_purchase",
        "listing_fee",
        "purchase_fee",
      ],
      user_role: ["user", "agent", "admin"],
    },
  },
} as const
