// Placeholder until `npm run gen:types` runs against the linked project.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          amount: number; created_at: string; currency: string; description: string; id: string;
          kind: string; paid_by: string; payer_share: number; spent_on: string;
        };
        Insert: {
          amount: number; created_at?: string; currency: string; description?: string; id?: string;
          kind: string; paid_by: string; payer_share: number; spent_on?: string;
        };
        Update: {
          amount?: number; created_at?: string; currency?: string; description?: string; id?: string;
          kind?: string; paid_by?: string; payer_share?: number; spent_on?: string;
        };
        Relationships: [];
      };
      members: {
        Row: { id: string; name: string; position: number };
        Insert: { id?: string; name: string; position: number };
        Update: { id?: string; name?: string; position?: number };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
