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
      campus_locations: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          floor_info: string | null
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          floor_info?: string | null
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          floor_info?: string | null
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          name?: string
        }
        Relationships: []
      }
      club_events: {
        Row: {
          club_id: string
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          is_past: boolean | null
          location: string | null
          title: string
        }
        Insert: {
          club_id: string
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_past?: boolean | null
          location?: string | null
          title: string
        }
        Update: {
          club_id?: string
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_past?: boolean | null
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          name: string
          position: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          name: string
          position?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          name?: string
          position?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          approval_token: string | null
          created_at: string | null
          description: string | null
          faculty_coordinator: string
          faculty_email: string | null
          id: string
          logo_url: string | null
          name: string
          recruitment_info: string | null
          recruitment_open: boolean | null
          status: string
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          approval_token?: string | null
          created_at?: string | null
          description?: string | null
          faculty_coordinator: string
          faculty_email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          recruitment_info?: string | null
          recruitment_open?: boolean | null
          status?: string
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_token?: string | null
          created_at?: string | null
          description?: string | null
          faculty_coordinator?: string
          faculty_email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          recruitment_info?: string | null
          recruitment_open?: boolean | null
          status?: string
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lost_found_items: {
        Row: {
          contact_info: string
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          location: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_info: string
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          location?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_info?: string
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          location?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          approval_token: string
          created_at: string | null
          faculty_email: string
          id: string
          item_id: string
          item_type: string
          status: string
          submitted_by: string
          updated_at: string | null
        }
        Insert: {
          approval_token: string
          created_at?: string | null
          faculty_email: string
          id?: string
          item_id: string
          item_type: string
          status?: string
          submitted_by: string
          updated_at?: string | null
        }
        Update: {
          approval_token?: string
          created_at?: string | null
          faculty_email?: string
          id?: string
          item_id?: string
          item_type?: string
          status?: string
          submitted_by?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          shop_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price: number
          shop_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          approval_token: string | null
          category: string
          closing_time: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          opening_time: string | null
          status: string
          submitted_by: string | null
        }
        Insert: {
          approval_token?: string | null
          category: string
          closing_time?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          opening_time?: string | null
          status?: string
          submitted_by?: string | null
        }
        Update: {
          approval_token?: string | null
          category?: string
          closing_time?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          opening_time?: string | null
          status?: string
          submitted_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          club_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      browse_lost_found_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          location: string | null
          status: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      public_club_members: {
        Row: {
          club_id: string | null
          id: string | null
          joined_at: string | null
          name: string | null
          position: string | null
          role: string | null
        }
        Insert: {
          club_id?: string | null
          id?: string | null
          joined_at?: string | null
          name?: string | null
          position?: string | null
          role?: string | null
        }
        Update: {
          club_id?: string | null
          id?: string | null
          joined_at?: string | null
          name?: string | null
          position?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      public_lost_found_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          location: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_club_president: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      is_faculty_email: { Args: { email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "club_president" | "user" | "faculty"
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
      app_role: ["admin", "club_president", "user", "faculty"],
    },
  },
} as const
