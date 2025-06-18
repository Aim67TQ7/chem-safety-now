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
      ai_conversations: {
        Row: {
          created_at: string | null
          facility_id: string | null
          id: string
          metadata: Json | null
          question: string
          response: string
          response_time_ms: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          facility_id?: string | null
          id?: string
          metadata?: Json | null
          question: string
          response: string
          response_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          facility_id?: string | null
          id?: string
          metadata?: Json | null
          question?: string
          response?: string
          response_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          facility_name: string | null
          feature_access_level: string | null
          id: string
          logo_url: string | null
          slug: string
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          facility_name?: string | null
          feature_access_level?: string | null
          id?: string
          logo_url?: string | null
          slug: string
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          facility_name?: string | null
          feature_access_level?: string | null
          id?: string
          logo_url?: string | null
          slug?: string
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      facility_qr_codes: {
        Row: {
          created_at: string
          facility_id: string
          facility_url: string
          id: string
          qr_code_url: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          facility_url: string
          id?: string
          qr_code_url: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          facility_url?: string
          id?: string
          qr_code_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_qr_codes_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_qr_codes_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          feature_name: string
          id: string
          required_plan: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_name: string
          id?: string
          required_plan?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_name?: string
          id?: string
          required_plan?: string | null
        }
        Relationships: []
      }
      label_generations: {
        Row: {
          action_type: string
          created_at: string | null
          facility_id: string | null
          hazard_codes: Json | null
          id: string
          label_type: string | null
          manufacturer: string | null
          metadata: Json | null
          pictograms: Json | null
          product_name: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          facility_id?: string | null
          hazard_codes?: Json | null
          id?: string
          label_type?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          pictograms?: Json | null
          product_name: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          facility_id?: string | null
          hazard_codes?: Json | null
          id?: string
          label_type?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          pictograms?: Json | null
          product_name?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_generations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_generations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_code_interactions: {
        Row: {
          action_type: string
          created_at: string | null
          facility_id: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          qr_code_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          facility_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          qr_code_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          facility_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          qr_code_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_interactions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_code_interactions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_code_interactions_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          access_code: string | null
          access_count: number | null
          code: string
          created_at: string
          facility_id: string | null
          facility_url: string | null
          id: string
          is_active: boolean | null
          last_accessed: string | null
          shop_name: string | null
          subscription_id: string
          user_id: string
        }
        Insert: {
          access_code?: string | null
          access_count?: number | null
          code: string
          created_at?: string
          facility_id?: string | null
          facility_url?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed?: string | null
          shop_name?: string | null
          subscription_id: string
          user_id: string
        }
        Update: {
          access_code?: string | null
          access_count?: number | null
          code?: string
          created_at?: string
          facility_id?: string | null
          facility_url?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed?: string | null
          shop_name?: string | null
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      sds_documents: {
        Row: {
          bucket_url: string | null
          cas_number: string | null
          created_at: string | null
          document_type: string | null
          environmental_hazards: Json | null
          extraction_quality_score: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          first_aid: Json | null
          full_text: string | null
          h_codes: Json | null
          hazard_statements: Json | null
          health_hazards: Json | null
          hmis_codes: Json | null
          id: string
          is_readable: boolean | null
          job_id: string | null
          manufacturer: string | null
          nfpa_codes: Json | null
          physical_hazards: Json | null
          pictograms: Json | null
          precautionary_statements: Json | null
          preparation_date: string | null
          product_name: string
          regulatory_notes: Json | null
          revision_date: string | null
          signal_word: string | null
          source_url: string
        }
        Insert: {
          bucket_url?: string | null
          cas_number?: string | null
          created_at?: string | null
          document_type?: string | null
          environmental_hazards?: Json | null
          extraction_quality_score?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          first_aid?: Json | null
          full_text?: string | null
          h_codes?: Json | null
          hazard_statements?: Json | null
          health_hazards?: Json | null
          hmis_codes?: Json | null
          id?: string
          is_readable?: boolean | null
          job_id?: string | null
          manufacturer?: string | null
          nfpa_codes?: Json | null
          physical_hazards?: Json | null
          pictograms?: Json | null
          precautionary_statements?: Json | null
          preparation_date?: string | null
          product_name: string
          regulatory_notes?: Json | null
          revision_date?: string | null
          signal_word?: string | null
          source_url: string
        }
        Update: {
          bucket_url?: string | null
          cas_number?: string | null
          created_at?: string | null
          document_type?: string | null
          environmental_hazards?: Json | null
          extraction_quality_score?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          first_aid?: Json | null
          full_text?: string | null
          h_codes?: Json | null
          hazard_statements?: Json | null
          health_hazards?: Json | null
          hmis_codes?: Json | null
          id?: string
          is_readable?: boolean | null
          job_id?: string | null
          manufacturer?: string | null
          nfpa_codes?: Json | null
          physical_hazards?: Json | null
          pictograms?: Json | null
          precautionary_statements?: Json | null
          preparation_date?: string | null
          product_name?: string
          regulatory_notes?: Json | null
          revision_date?: string | null
          signal_word?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sds_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sds_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sds_interactions: {
        Row: {
          action_type: string
          created_at: string | null
          facility_id: string | null
          id: string
          metadata: Json | null
          sds_document_id: string | null
          search_query: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          facility_id?: string | null
          id?: string
          metadata?: Json | null
          sds_document_id?: string | null
          search_query?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          facility_id?: string | null
          id?: string
          metadata?: Json | null
          sds_document_id?: string | null
          search_query?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sds_interactions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sds_interactions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sds_interactions_sds_document_id_fkey"
            columns: ["sds_document_id"]
            isOneToOne: false
            referencedRelation: "sds_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      sds_jobs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          max_results: number | null
          message: string | null
          product_name: string
          progress: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          max_results?: number | null
          message?: string | null
          product_name: string
          progress?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          max_results?: number | null
          message?: string | null
          product_name?: string
          progress?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          facility_id: string | null
          id: string
          payment_status: string | null
          plan_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_period?: string | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          facility_id?: string | null
          id?: string
          payment_status?: string | null
          plan_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_period?: string | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          facility_id?: string | null
          id?: string
          payment_status?: string | null
          plan_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number | null
          created_at: string | null
          features: Json | null
          id: string
          monthly_price: number | null
          name: string
          stripe_annual_price_id: string | null
          stripe_monthly_price_id: string | null
        }
        Insert: {
          annual_price?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          monthly_price?: number | null
          name: string
          stripe_annual_price_id?: string | null
          stripe_monthly_price_id?: string | null
        }
        Update: {
          annual_price?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          monthly_price?: number | null
          name?: string
          stripe_annual_price_id?: string | null
          stripe_monthly_price_id?: string | null
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          annual_price: number
          created_at: string
          id: string
          lookup_limit: number
          monthly_price: number
          name: string
        }
        Insert: {
          annual_price: number
          created_at?: string
          id?: string
          lookup_limit: number
          monthly_price: number
          name: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          id?: string
          lookup_limit?: number
          monthly_price?: number
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_lookups: number | null
          current_period_end: string | null
          current_period_start: string | null
          facility_id: string | null
          id: string
          lookup_reset_date: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_lookups?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          facility_id?: string | null
          id?: string
          lookup_reset_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_lookups?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          facility_id?: string | null
          id?: string
          lookup_reset_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "admin_facility_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_facility_overview: {
        Row: {
          address: string | null
          annual_price: number | null
          contact_name: string | null
          created_at: string | null
          current_plan: string | null
          email: string | null
          facility_name: string | null
          facility_url: string | null
          feature_access_level: string | null
          id: string | null
          logo_url: string | null
          monthly_price: number | null
          qr_code_url: string | null
          slug: string | null
          subscription_status: string | null
          trial_days_remaining: number | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_feature_access: {
        Args: { p_facility_id: string; p_feature_name: string }
        Returns: boolean
      }
      increment_lookup_count: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      reset_monthly_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_facility_subscription: {
        Args: {
          p_facility_id: string
          p_plan_name: string
          p_stripe_subscription_id?: string
        }
        Returns: boolean
      }
      upgrade_user_subscription: {
        Args: { p_user_id: string; p_tier_name: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
