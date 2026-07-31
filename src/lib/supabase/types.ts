/**
 * Generated Supabase types. Do not edit by hand.
 *
 * Regenerate after any migration:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["admin_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["admin_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["admin_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      shipment_events: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          facility_label: string | null;
          id: string;
          is_public: boolean;
          latitude: number | null;
          longitude: number | null;
          occurred_at: string;
          shipment_id: string;
          state: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          title: string;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          facility_label?: string | null;
          id?: string;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          occurred_at?: string;
          shipment_id: string;
          state?: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          title: string;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          facility_label?: string | null;
          id?: string;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          occurred_at?: string;
          shipment_id?: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      shipment_ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          requester_ip_hash: string | null;
          shipment_id: string;
          stars: number;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          requester_ip_hash?: string | null;
          shipment_id: string;
          stars: number;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          requester_ip_hash?: string | null;
          shipment_id?: string;
          stars?: number;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_ratings_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: true;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      shipments: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          current_location_label: string | null;
          delivered_at: string | null;
          destination_address_line1: string | null;
          destination_address_line2: string | null;
          destination_city: string;
          destination_country: string;
          destination_latitude: number | null;
          destination_longitude: number | null;
          destination_postal_code: string | null;
          destination_state: string | null;
          estimated_delivery_date: string | null;
          estimated_delivery_window: string | null;
          height_cm: number | null;
          id: string;
          internal_notes: string | null;
          length_cm: number | null;
          origin_address_line1: string | null;
          origin_address_line2: string | null;
          origin_city: string;
          origin_country: string;
          origin_latitude: number | null;
          origin_longitude: number | null;
          origin_postal_code: string | null;
          origin_state: string | null;
          package_type: string | null;
          payment_currency: string | null;
          payment_reference: string | null;
          payment_status: string | null;
          piece_count: number;
          recipient_company: string | null;
          recipient_contact_email: string | null;
          recipient_email: string | null;
          recipient_email_submitted_at: string | null;
          recipient_name: string | null;
          recipient_phone: string | null;
          sender_company: string | null;
          sender_email: string | null;
          sender_name: string | null;
          sender_phone: string | null;
          service_level: Database["public"]["Enums"]["service_level"];
          shipped_at: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          total_amount_due: number | null;
          tracking_id: string;
          updated_at: string;
          weight_kg: number | null;
          width_cm: number | null;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_location_label?: string | null;
          delivered_at?: string | null;
          destination_address_line1?: string | null;
          destination_address_line2?: string | null;
          destination_city: string;
          destination_country?: string;
          destination_latitude?: number | null;
          destination_longitude?: number | null;
          destination_postal_code?: string | null;
          destination_state: string | null;
          estimated_delivery_date?: string | null;
          estimated_delivery_window?: string | null;
          height_cm?: number | null;
          id?: string;
          internal_notes?: string | null;
          length_cm?: number | null;
          origin_address_line1?: string | null;
          origin_address_line2?: string | null;
          origin_city: string;
          origin_country?: string;
          origin_latitude?: number | null;
          origin_longitude?: number | null;
          origin_postal_code?: string | null;
          origin_state: string | null;
          package_type?: string | null;
          payment_currency?: string | null;
          payment_reference?: string | null;
          payment_status?: string | null;
          piece_count?: number;
          recipient_company?: string | null;
          recipient_contact_email?: string | null;
          recipient_email?: string | null;
          recipient_email_submitted_at?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          sender_company?: string | null;
          sender_email?: string | null;
          sender_name?: string | null;
          sender_phone?: string | null;
          service_level?: Database["public"]["Enums"]["service_level"];
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          total_amount_due?: number | null;
          tracking_id?: string;
          updated_at?: string;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_location_label?: string | null;
          delivered_at?: string | null;
          destination_address_line1?: string | null;
          destination_address_line2?: string | null;
          destination_city?: string;
          destination_country?: string;
          destination_latitude?: number | null;
          destination_longitude?: number | null;
          destination_postal_code?: string | null;
          destination_state?: string | null;
          estimated_delivery_date?: string | null;
          estimated_delivery_window?: string | null;
          height_cm?: number | null;
          id?: string;
          internal_notes?: string | null;
          length_cm?: number | null;
          origin_address_line1?: string | null;
          origin_address_line2?: string | null;
          origin_city?: string;
          origin_country?: string;
          origin_latitude?: number | null;
          origin_longitude?: number | null;
          origin_postal_code?: string | null;
          origin_state?: string | null;
          package_type?: string | null;
          payment_currency?: string | null;
          payment_reference?: string | null;
          payment_status?: string | null;
          piece_count?: number;
          recipient_company?: string | null;
          recipient_contact_email?: string | null;
          recipient_email?: string | null;
          recipient_email_submitted_at?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          sender_company?: string | null;
          sender_email?: string | null;
          sender_name?: string | null;
          sender_phone?: string | null;
          service_level?: Database["public"]["Enums"]["service_level"];
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          total_amount_due?: number | null;
          tracking_id?: string;
          updated_at?: string;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Relationships: [];
      };
      support_requests: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          requester_ip_hash: string | null;
          source: string;
          status: Database["public"]["Enums"]["support_request_status"];
          subject: string;
          tracking_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          requester_ip_hash?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["support_request_status"];
          subject: string;
          tracking_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          requester_ip_hash?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["support_request_status"];
          subject?: string;
          tracking_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_write_shipments: { Args: never; Returns: boolean };
      current_admin_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["admin_role"];
      };
      generate_tracking_id: {
        Args: { p_destination_country?: string };
        Returns: string;
      };
      is_active_admin: { Args: never; Returns: boolean };
      normalize_tracking_id: { Args: { p_value: string }; Returns: string };
      service_performance: { Args: never; Returns: Json };
      shipment_rating_state: { Args: { p_tracking_id: string }; Returns: Json };
      submit_recipient_email: {
        Args: { p_email: string; p_tracking_id: string };
        Returns: Json;
      };
      submit_shipment_rating: {
        Args: {
          p_comment?: string;
          p_ip_hash?: string;
          p_stars: number;
          p_tracking_id: string;
        };
        Returns: Json;
      };
      submit_support_request: {
        Args: {
          p_email: string;
          p_ip_hash?: string;
          p_message: string;
          p_name: string;
          p_phone?: string;
          p_subject: string;
          p_tracking_id?: string;
        };
        Returns: undefined;
      };
      track_shipment: { Args: { p_tracking_id: string }; Returns: Json };
    };
    Enums: {
      admin_role: "owner" | "operator" | "viewer";
      service_level: "standard" | "express" | "priority" | "same_day" | "freight";
      shipment_status:
        | "created"
        | "label_created"
        | "picked_up"
        | "in_transit"
        | "arrived_at_facility"
        | "out_for_delivery"
        | "delivered"
        | "delivery_attempted"
        | "delayed"
        | "exception"
        | "awaiting_verification"
        | "returned"
        | "cancelled";
      support_request_status: "new" | "in_review" | "resolved" | "closed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][EnumName];
