export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFeature {
  id: string;
  product_id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface LicenseType {
  id: string;
  product_id: string;
  name: string;
  code: string;
  description: string;
  max_users: number | null;
  monthly_price: number | null;
  yearly_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface LicenseFeature {
  license_type_id: string;
  feature_id: string;
}

export interface ProjectType {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProductProjectType {
  product_id: string;
  project_type_id: string;
}