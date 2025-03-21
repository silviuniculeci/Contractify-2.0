-- First, clear existing products
TRUNCATE TABLE products CASCADE;

-- Insert only the three required products
INSERT INTO products (name, code, description)
VALUES 
  ('Timeqode', 'TIMEQODE', 'Timeqode Platform'),
  ('Microsoft Dynamics 365 Business Central', 'BUSINESS_CENTRAL', 'ERP solution for small and medium-sized businesses'),
  ('Microsoft Dynamics 365 Finance and Operations', 'FINANCE_OPS', 'ERP solution for enterprise-level businesses');

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Everyone can view products'
    ) THEN
        CREATE POLICY "Everyone can view products"
        ON products
        FOR SELECT
        USING (true);
    END IF;
END
$$;

-- First, create the product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'product_categories' AND policyname = 'Everyone can view product categories'
    ) THEN
        CREATE POLICY "Everyone can view product categories"
        ON product_categories
        FOR SELECT
        USING (true);
    END IF;
END
$$;

-- Insert the three product categories
INSERT INTO product_categories (name, code, description)
VALUES 
  ('Timeqode', 'TIMEQODE', 'Timeqode Platform'),
  ('Business Central', 'BUSINESS_CENTRAL', 'ERP solution for small and medium-sized businesses'),
  ('Finance & Operations', 'FINANCE_OPS', 'ERP solution for enterprise-level businesses');

-- Add category_id to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id UUID REFERENCES product_categories(id);
    END IF;
END
$$; 