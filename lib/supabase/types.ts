// Minimal hand-written types matching supabase/schema.sql.
// If you prefer, generate these automatically later with:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          avatar_shape: "circle" | "square" | "hex" | "shield";
          avatar_color: string;
          avatar_icon: string | null;
          onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_shape?: "circle" | "square" | "hex" | "shield";
          avatar_color?: string;
          avatar_icon?: string | null;
          onboarded?: boolean;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_shape?: "circle" | "square" | "hex" | "shield";
          avatar_color?: string;
          avatar_icon?: string | null;
          onboarded?: boolean;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          sport: string | null;
          icon_emoji: string;
          color: string;
          avatar_url: string | null;
          created_by: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          name: string;
          sport?: string | null;
          icon_emoji?: string;
          color?: string;
          avatar_url?: string | null;
          created_by: string;
          invite_code: string;
        };
        Update: {
          name?: string;
          sport?: string | null;
          icon_emoji?: string;
          color?: string;
          avatar_url?: string | null;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: "admin" | "member";
        };
        Update: {
          role?: "admin" | "member";
        };
      };
      sessions: {
        Row: {
          id: string;
          group_id: string;
          title: string | null;
          sport: "volleyball" | "soccer" | "basketball" | "football";
          format_label: string;
          per_side: number;
          venue: string | null;
          fields_count: number;
          location: string;
          starts_at: string;
          max_players: number | null;
          total_cost: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          group_id: string;
          title?: string | null;
          sport: "volleyball" | "soccer" | "basketball" | "football";
          format_label: string;
          per_side: number;
          venue?: string | null;
          fields_count?: number;
          location: string;
          starts_at: string;
          max_players?: number | null;
          total_cost?: number;
          created_by: string;
        };
        Update: {
          title?: string | null;
          location?: string;
          starts_at?: string;
          max_players?: number | null;
          total_cost?: number;
        };
      };
      rsvps: {
        Row: {
          session_id: string;
          user_id: string;
          status: "in" | "out" | "maybe";
          paid: boolean;
          responded_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          status?: "in" | "out" | "maybe";
          paid?: boolean;
        };
        Update: {
          status?: "in" | "out" | "maybe";
          paid?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          content?: string;
        };
      };
      group_reads: {
        Row: {
          group_id: string;
          user_id: string;
          last_seen_sessions_at: string;
          last_seen_chat_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          last_seen_sessions_at?: string;
          last_seen_chat_at?: string;
        };
        Update: {
          last_seen_sessions_at?: string;
          last_seen_chat_at?: string;
        };
      };
    };
  };
};
