export type ContractType = string;
export type OfferStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface Offer {
  id: string;
  customer_name: string;
  cui: string;
  order_date: string | null;
  sales_person: string;
  contract_type: ContractType;
  project_description: string;
  go_live_date: string | null;
  approver: string;
  approval_date: string | null;
  status: OfferStatus;
  value: number | null;
  product_id: string | null;
  license_type_id: string | null;
  number_of_users: number | null;
  duration_months: number | null;
  project_type_id: string | null;
  annual_commitment: boolean;
  margin_pct: number;
  discount_pct: number;
  created_by: string;
  created_at: string;
  updated_at: string;
} 