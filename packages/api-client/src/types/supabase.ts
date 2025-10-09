export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          created_at: string;
          id: string;
          payload: Json;
          completed_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          payload: Json;
          completed_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          payload?: Json;
          completed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          role: Database["public"]["Enums"]["chat_message_role"];
          session_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          role: Database["public"]["Enums"]["chat_message_role"];
          session_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          role?: Database["public"]["Enums"]["chat_message_role"];
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string;
          id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          legal_acceptance_at: string | null;
          onboarding_completed_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email: string;
          legal_acceptance_at?: string | null;
          onboarding_completed_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string;
          legal_acceptance_at?: string | null;
          onboarding_completed_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      quests_progress: {
        Row: {
          answer: Json | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          quest_id: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["quest_progress_status"];
          user_id: string;
        };
        Insert: {
          answer?: Json | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          quest_id: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["quest_progress_status"];
          user_id: string;
        };
        Update: {
          answer?: Json | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          quest_id?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["quest_progress_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quests_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      reports: {
        Row: {
          content: Json;
          created_at: string;
          generated_at: string;
          id: string;
          report_type: string;
          title: string | null;
          user_id: string;
        };
        Insert: {
          content: Json;
          created_at?: string;
          generated_at?: string;
          id?: string;
          report_type: string;
          title?: string | null;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          generated_at?: string;
          id?: string;
          report_type?: string;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      chat_message_role: 'user' | 'assistant' | 'system';
      quest_progress_status: 'available' | 'in_progress' | 'completed';
    };
    CompositeTypes: {};
  };
};
