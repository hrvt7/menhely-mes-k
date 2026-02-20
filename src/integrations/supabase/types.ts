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
      animal_photos: {
        Row: {
          animal_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          sort_order: number | null
          storage_path: string
          url: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          sort_order?: number | null
          storage_path: string
          url?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          sort_order?: number | null
          storage_path?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_photos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_status_log: {
        Row: {
          animal_id: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          animal_id: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          animal_id?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_status_log_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          adopted_at: string | null
          age_years: number | null
          ai_text_fit: string | null
          ai_text_long: string | null
          ai_text_short: string | null
          breed_hint: string | null
          chip_id: string | null
          created_at: string | null
          date_of_birth: string | null
          fb_post_id: string | null
          fb_post_url: string | null
          fb_posted_at: string | null
          id: string
          is_ready_to_post: boolean | null
          name: string
          notes: string | null
          sex: string | null
          shelter_id: string
          size: string | null
          species: string
          status: string
          updated_at: string | null
        }
        Insert: {
          adopted_at?: string | null
          age_years?: number | null
          ai_text_fit?: string | null
          ai_text_long?: string | null
          ai_text_short?: string | null
          breed_hint?: string | null
          chip_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          fb_post_id?: string | null
          fb_post_url?: string | null
          fb_posted_at?: string | null
          id?: string
          is_ready_to_post?: boolean | null
          name: string
          notes?: string | null
          sex?: string | null
          shelter_id: string
          size?: string | null
          species: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          adopted_at?: string | null
          age_years?: number | null
          ai_text_fit?: string | null
          ai_text_long?: string | null
          ai_text_short?: string | null
          breed_hint?: string | null
          chip_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          fb_post_id?: string | null
          fb_post_url?: string | null
          fb_posted_at?: string | null
          id?: string
          is_ready_to_post?: boolean | null
          name?: string
          notes?: string | null
          sex?: string | null
          shelter_id?: string
          size?: string | null
          species?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_rows: number | null
          duplicate_rows: number | null
          duplicates: Json | null
          error_rows: number | null
          errors: Json | null
          file_name: string
          id: string
          shelter_id: string
          status: string | null
          total_rows: number | null
          updated_rows: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_rows?: number | null
          duplicate_rows?: number | null
          duplicates?: Json | null
          error_rows?: number | null
          errors?: Json | null
          file_name: string
          id?: string
          shelter_id: string
          status?: string | null
          total_rows?: number | null
          updated_rows?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_rows?: number | null
          duplicate_rows?: number | null
          duplicates?: Json | null
          error_rows?: number | null
          errors?: Json | null
          file_name?: string
          id?: string
          shelter_id?: string
          status?: string | null
          total_rows?: number | null
          updated_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_users: {
        Row: {
          created_at: string | null
          id: string
          role: string
          shelter_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          shelter_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          shelter_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shelter_users_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          default_cta: string | null
          facebook_access_token: string | null
          facebook_page_id: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          default_cta?: string | null
          facebook_access_token?: string | null
          facebook_page_id?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          default_cta?: string | null
          facebook_access_token?: string | null
          facebook_page_id?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
