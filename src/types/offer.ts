export type ContractType = 'Implementation' | 'Default';
export type OfferStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface Offer {
  id?: string;
  customer_name: string;
  cui: string;
  order_date: string | null;
  sales_person: string;
  contract_type: ContractType;
  project_description: string;
  go_live_date: string | null;
  approver: string | null;
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
  product_category: string | null;
  project_type: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface License {
  id: number;
  type: string;
  quantity: number;
  price: string;
  annualCommitment: boolean;
  monthlyPayment: boolean;
  discount: number;
  totalValue: string;
  marginValue: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  monthly_price: number | null;
  yearly_price: number | null;
}

export interface ProjectType {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface LicenseType {
  id: string;
  name: string;
  code: string;
  description: string;
  monthly_price: number | null;
  yearly_price: number | null;
  product_id: string;
} 