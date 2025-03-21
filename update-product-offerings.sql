-- Add new products: Business Central and Finance & Operations
INSERT INTO products (name, code, description)
VALUES 
('Microsoft Dynamics 365 Business Central', 'BUSINESS_CENTRAL', 'ERP solution for small and medium-sized businesses'),
('Microsoft Dynamics 365 Finance and Operations', 'FINANCE_OPS', 'ERP solution for enterprise-level businesses')
ON CONFLICT (code) DO NOTHING;

-- Create a new table for project types
CREATE TABLE IF NOT EXISTS project_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for project_types
ALTER TABLE project_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'project_types' AND policyname = 'Everyone can view project types'
    ) THEN
        CREATE POLICY "Everyone can view project types"
        ON project_types
        FOR SELECT
        USING (true);
    END IF;
END
$$;

-- Insert project types
INSERT INTO project_types (name, code, description)
VALUES
('Project Implementation', 'IMPLEMENTATION', 'Full implementation of the product'),
('Project Localization', 'LOCALIZATION', 'Localization of the product for specific markets')
ON CONFLICT (code) DO NOTHING;

-- Create a table for product_project_types mapping
CREATE TABLE IF NOT EXISTS product_project_types (
    product_id UUID REFERENCES products(id),
    project_type_id UUID REFERENCES project_types(id),
    PRIMARY KEY (product_id, project_type_id)
);

-- Enable RLS for product_project_types
ALTER TABLE product_project_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_project_types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'product_project_types' AND policyname = 'Everyone can view product project types'
    ) THEN
        CREATE POLICY "Everyone can view product project types"
        ON product_project_types
        FOR SELECT
        USING (true);
    END IF;
END
$$;

-- Get product IDs
DO $$
DECLARE
    timeqode_id UUID;
    bc_id UUID;
    fo_id UUID;
    impl_id UUID;
    local_id UUID;
BEGIN
    -- Get product IDs
    SELECT id INTO timeqode_id FROM products WHERE code = 'PLATFORM';
    SELECT id INTO bc_id FROM products WHERE code = 'BUSINESS_CENTRAL';
    SELECT id INTO fo_id FROM products WHERE code = 'FINANCE_OPS';
    
    -- Get project type IDs
    SELECT id INTO impl_id FROM project_types WHERE code = 'IMPLEMENTATION';
    SELECT id INTO local_id FROM project_types WHERE code = 'LOCALIZATION';
    
    -- Map products to project types
    -- Timeqode can have Implementation or no project type
    INSERT INTO product_project_types (product_id, project_type_id)
    VALUES (timeqode_id, impl_id)
    ON CONFLICT DO NOTHING;
    
    -- Business Central can have Implementation or Localization
    INSERT INTO product_project_types (product_id, project_type_id)
    VALUES 
    (bc_id, impl_id),
    (bc_id, local_id)
    ON CONFLICT DO NOTHING;
    
    -- Finance & Operations can have Implementation or Localization
    INSERT INTO product_project_types (product_id, project_type_id)
    VALUES 
    (fo_id, impl_id),
    (fo_id, local_id)
    ON CONFLICT DO NOTHING;
    
    -- Insert Business Central license types
    INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
    VALUES
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Essentials', 'BC-ESSENTIALS', NULL, 70.00, 756.00, 'Basic functionality for business management'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Premium', 'BC-PREMIUM', NULL, 100.00, 1080.00, 'Advanced functionality including manufacturing and service management'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Team Members', 'BC-TEAM-MEMBERS', NULL, 8.00, 86.40, 'Limited functionality for employees who need minimal ERP access'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Device', 'BC-DEVICE', NULL, 40.00, 432.00, 'Full user access tied to a device rather than a user'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Additional Environment Addon', 'BC-ENV-ADDON', NULL, 40.00, 432.00, 'Additional environment for development, testing, or sandbox use'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central External Accountant', 'BC-EXTERNAL-ACCT', NULL, 0.00, 0.00, 'Access for external accountants at no additional cost'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Essentials Attach', 'BC-ESSENTIALS-ATTACH', NULL, 42.00, 453.60, 'Discounted rate for Essentials when adding to existing qualifying Dynamics 365 license'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Database Capacity', 'BC-DB-CAPACITY', NULL, 30.00, 324.00, 'Additional database storage capacity'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Database Capacity Overage', 'BC-DB-OVERAGE', NULL, 7.50, 81.00, 'Additional database storage beyond included capacity'),
    ((SELECT id FROM products WHERE code = 'BUSINESS_CENTRAL'), 'Dynamics 365 Business Central Database Capacity 100GB', 'BC-DB-100GB', NULL, 750.00, 8100.00, 'Additional database storage capacity of 100GB')
    ON CONFLICT (product_id, code) DO UPDATE 
    SET 
      name = EXCLUDED.name,
      monthly_price = EXCLUDED.monthly_price,
      yearly_price = EXCLUDED.yearly_price,
      description = EXCLUDED.description;
    
    -- Insert Finance & Operations license types (example license types)
    INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
    VALUES
    (fo_id, 'Finance', 'FO-FINANCE', NULL, 180.00, 1944.00, 'Finance management capabilities'),
    (fo_id, 'Supply Chain Management', 'FO-SCM', NULL, 180.00, 1944.00, 'Supply chain management capabilities'),
    (fo_id, 'Commerce', 'FO-COMMERCE', NULL, 180.00, 1944.00, 'Retail and commerce capabilities'),
    (fo_id, 'Human Resources', 'FO-HR', NULL, 120.00, 1296.00, 'Human resources management'),
    (fo_id, 'Team Members', 'FO-TEAM-MEMBERS', NULL, 8.00, 86.40, 'Limited functionality for employees who need minimal ERP access')
    ON CONFLICT (product_id, code) DO NOTHING;
END
$$;

-- Add annual_commitment column to offers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offers' AND column_name = 'annual_commitment'
    ) THEN
        ALTER TABLE offers ADD COLUMN annual_commitment BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Add project_type_id column to offers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offers' AND column_name = 'project_type_id'
    ) THEN
        ALTER TABLE offers ADD COLUMN project_type_id UUID REFERENCES project_types(id);
    END IF;
END
$$;

-- Add margin_pct column to offers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offers' AND column_name = 'margin_pct'
    ) THEN
        ALTER TABLE offers ADD COLUMN margin_pct DECIMAL(5,2) DEFAULT 30.00;
    END IF;
END
$$;

-- Add discount_pct column to offers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offers' AND column_name = 'discount_pct'
    ) THEN
        ALTER TABLE offers ADD COLUMN discount_pct DECIMAL(5,2) DEFAULT 0.00;
    END IF;
END
$$;

-- Create a function to calculate total value with annual commitment
CREATE OR REPLACE FUNCTION calculate_offer_total(
    base_price DECIMAL,
    discount_pct DECIMAL,
    annual_commitment BOOLEAN
) RETURNS DECIMAL AS $$
DECLARE
    discounted_price DECIMAL;
    total_price DECIMAL;
BEGIN
    -- Calculate discounted price
    discounted_price := base_price * (1 - discount_pct / 100);
    
    -- Calculate total based on annual commitment
    IF annual_commitment THEN
        total_price := discounted_price * 12;
    ELSE
        total_price := discounted_price;
    END IF;
    
    RETURN total_price;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate margin
CREATE OR REPLACE FUNCTION calculate_margin(
    base_price DECIMAL,
    discount_pct DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    discounted_price DECIMAL;
BEGIN
    -- Calculate discounted price
    discounted_price := base_price * (1 - discount_pct / 100);
    
    -- Margin is 30% of discounted price
    RETURN ROUND(discounted_price * 0.3, 2);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS offers_project_type_id_idx ON offers(project_type_id);
CREATE INDEX IF NOT EXISTS offers_annual_commitment_idx ON offers(annual_commitment); 