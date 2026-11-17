import type { Database } from "@/integrations/supabase/types";

export type MpesaPaymentStatus = "pending" | "completed" | "failed";

export type MpesaPaymentRow = {
  id: string;
  booking_reference: string;
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  phone: string;
  amount_kes: number;
  status: MpesaPaymentStatus;
  result_code: number | null;
  result_description: string | null;
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
};

type MpesaPaymentTable = {
  Row: MpesaPaymentRow;
  Insert: Omit<MpesaPaymentRow, "id" | "created_at" | "updated_at"> &
    Partial<Pick<MpesaPaymentRow, "id" | "created_at" | "updated_at">>;
  Update: Partial<MpesaPaymentRow>;
  Relationships: [];
};

export type MpesaDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      mpesa_payments: MpesaPaymentTable;
    };
  };
};
