export type ContractType = 'Implementation' | 'Support' | 'License';
export type CostCenter = 'AROGO';
export type OfferStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface Offer {
  id: string;
  customer_name: string;
  cui: string;
  order_date: string | null;
  sales_person: string;
  contract_type: ContractType;
  cost_center: CostCenter;
  project_description: string | null;
  go_live_date: string | null;
  approver: string | null;
  approval_date: string | null;
  status: OfferStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Financial information
  value: number | null;
  margin_pct: number | null;
  discount_pct: number | null;
  annual_commitment: boolean;
  
  // Product information
  product_id: string | null;
  license_type_id: string | null;
  number_of_users: number | null;
  duration_months: number | null;
  project_type_id: string | null;
} 