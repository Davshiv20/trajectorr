// Database types matching your Supabase schema

export interface Database {
  public: {
    Tables: {
      processes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          key: string; // color key: 'code' | 'run' | 'read' | 'zen'
          created_at: string;
          archived_at: string | null;
          ai_insight: string | null;
          ai_tag: string | null;
          ai_insight_log_count: number | null;
          ai_insight_updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          key?: string;
          created_at?: string;
          archived_at?: string | null;
          ai_insight?: string | null;
          ai_tag?: string | null;
          ai_insight_log_count?: number | null;
          ai_insight_updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          key?: string;
          created_at?: string;
          archived_at?: string | null;
          ai_insight?: string | null;
          ai_tag?: string | null;
          ai_insight_log_count?: number | null;
          ai_insight_updated_at?: string | null;
        };
      };
      logs: {
        Row: {
          id: string;
          process_id: string;
          logged_at: string; // ISO date string (YYYY-MM-DD)
          created_at: string;
        };
        Insert: {
          id?: string;
          process_id: string;
          logged_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          process_id?: string;
          logged_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Process = Database['public']['Tables']['processes']['Row'];
export type ProcessInsert = Database['public']['Tables']['processes']['Insert'];
export type Log = Database['public']['Tables']['logs']['Row'];
export type LogInsert = Database['public']['Tables']['logs']['Insert'];
