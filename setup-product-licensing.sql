-- Drop existing foreign key constraints from offers table
ALTER TABLE offers
DROP CONSTRAINT IF EXISTS offers_product_id_fkey,
DROP CONSTRAINT IF EXISTS offers_license_type_id_fkey;

-- Drop existing indexes
DROP INDEX IF EXISTS offers_product_id_idx;
DROP INDEX IF EXISTS offers_license_type_id_idx;

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS license_features CASCADE;
DROP TABLE IF EXISTS product_features CASCADE;
DROP TABLE IF EXISTS license_types CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create tables
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value TEXT,
    feature_type VARCHAR(50), -- 'boolean', 'numeric', 'text'
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE license_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    max_users INTEGER,
    monthly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, code)
);

CREATE TABLE license_features (
    license_type_id UUID REFERENCES license_types(id),
    feature_id UUID REFERENCES product_features(id),
    feature_value TEXT,
    PRIMARY KEY (license_type_id, feature_id)
);

-- Add foreign key constraints to offers table
ALTER TABLE offers
ADD CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id),
ADD CONSTRAINT offers_license_type_id_fkey FOREIGN KEY (license_type_id) REFERENCES license_types(id);

-- Create indexes for new columns
CREATE INDEX offers_product_id_idx ON offers(product_id);
CREATE INDEX offers_license_type_id_idx ON offers(license_type_id);

-- Set up RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Admin can manage products'
    ) THEN
        CREATE POLICY "Admin can manage products"
        ON products
        FOR ALL
        USING (
            auth.jwt() ->> 'role' = 'admin'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'product_features' AND policyname = 'Everyone can view product features'
    ) THEN
        CREATE POLICY "Everyone can view product features"
        ON product_features
        FOR SELECT
        USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'license_types' AND policyname = 'Everyone can view license types'
    ) THEN
        CREATE POLICY "Everyone can view license types"
        ON license_types
        FOR SELECT
        USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'license_features' AND policyname = 'Everyone can view license features'
    ) THEN
        CREATE POLICY "Everyone can view license features"
        ON license_features
        FOR SELECT
        USING (true);
    END IF;
END
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_license_types_updated_at ON license_types;
CREATE TRIGGER update_license_types_updated_at
    BEFORE UPDATE ON license_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
DO $$
DECLARE
    platform_id UUID;
    efactura_id UUID;
    etransport_id UUID;
BEGIN
    -- Insert Timeqode Platform product
    INSERT INTO products (name, code, description)
    SELECT 'Timeqode Platform', 'PLATFORM', 'No-code development platform for building business applications quickly and efficiently.'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'PLATFORM')
    RETURNING id INTO platform_id;

    -- Insert Platform features
    INSERT INTO product_features (product_id, name, description, feature_type)
    VALUES
    (platform_id, 'Applications End-Users', 'Number of end users allowed', 'numeric'),
    (platform_id, 'Unlimited Applications', 'Access to unlimited applications', 'boolean'),
    (platform_id, 'Configuration User', 'Configuration user access', 'text'),
    (platform_id, 'Configuration User Limit', 'Limit for configuration users', 'text'),
    (platform_id, 'Cloud Infrastructure', 'Type of cloud infrastructure', 'text'),
    (platform_id, 'Database Size Limit', 'Maximum database size allowed', 'text'),
    (platform_id, 'Cloud Infrastructure Uptime', 'Guaranteed uptime percentage', 'text'),
    (platform_id, 'High Availability & Load Balancing', 'HA and load balancing support', 'boolean'),
    (platform_id, 'Environments', 'Number of environments', 'numeric'),
    (platform_id, 'Onboarding', 'Onboarding support', 'boolean'),
    (platform_id, 'Platform Maintenance', 'Platform maintenance included', 'boolean'),
    (platform_id, 'Online Support', 'Support availability', 'text');

    -- Insert Platform license types
    INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
    VALUES
    (platform_id, 'Basic', 'PLATFORM-BASIC', 20, 480.00, 400.00, 'Basic tier for up to 20 users'),
    (platform_id, 'Standard', 'PLATFORM-STD', 50, 950.00, 800.00, 'Standard tier for 21-50 users'),
    (platform_id, 'Professional', 'PLATFORM-PRO', 100, 1440.00, 1200.00, 'Professional tier for 51-100 users'),
    (platform_id, 'Enterprise', 'PLATFORM-ENT', NULL, NULL, NULL, 'Custom enterprise solution with flexible user count and pricing. Full feature set with premium support. Contact us for a tailored quote.');

    -- Insert Platform feature values
    INSERT INTO license_features (license_type_id, feature_id, feature_value)
    SELECT 
        lt.id,
        pf.id,
        CASE 
            WHEN pf.name = 'Applications End-Users' AND lt.code = 'PLATFORM-BASIC' THEN '1-20'
            WHEN pf.name = 'Applications End-Users' AND lt.code = 'PLATFORM-STD' THEN '21-50'
            WHEN pf.name = 'Applications End-Users' AND lt.code = 'PLATFORM-PRO' THEN '51-100'
            WHEN pf.name = 'Applications End-Users' AND lt.code = 'PLATFORM-ENT' THEN 'Custom'
            WHEN pf.name = 'Unlimited Applications' THEN 'true'
            WHEN pf.name = 'Configuration User' AND lt.code IN ('PLATFORM-BASIC', 'PLATFORM-STD') THEN '1 included'
            WHEN pf.name = 'Configuration User' AND lt.code IN ('PLATFORM-PRO', 'PLATFORM-ENT') THEN 'Custom'
            WHEN pf.name = 'Configuration User Limit' AND lt.code IN ('PLATFORM-BASIC', 'PLATFORM-STD') THEN 'Limited to 1'
            WHEN pf.name = 'Configuration User Limit' AND lt.code IN ('PLATFORM-PRO', 'PLATFORM-ENT') THEN 'Unlimited'
            WHEN pf.name = 'Cloud Infrastructure' AND lt.code != 'PLATFORM-ENT' THEN 'Shared'
            WHEN pf.name = 'Cloud Infrastructure' AND lt.code = 'PLATFORM-ENT' THEN 'Dedicated'
            WHEN pf.name = 'Database Size Limit' AND lt.code = 'PLATFORM-BASIC' THEN '5GB'
            WHEN pf.name = 'Database Size Limit' AND lt.code = 'PLATFORM-STD' THEN '10GB'
            WHEN pf.name = 'Database Size Limit' AND lt.code = 'PLATFORM-PRO' THEN '20GB'
            WHEN pf.name = 'Database Size Limit' AND lt.code = 'PLATFORM-ENT' THEN 'Custom'
            WHEN pf.name = 'Cloud Infrastructure Uptime' AND lt.code != 'PLATFORM-ENT' THEN '99.90%'
            WHEN pf.name = 'Cloud Infrastructure Uptime' AND lt.code = 'PLATFORM-ENT' THEN '99.95%'
            WHEN pf.name = 'High Availability & Load Balancing' AND lt.code = 'PLATFORM-PRO' THEN 'Optional'
            WHEN pf.name = 'High Availability & Load Balancing' AND lt.code = 'PLATFORM-ENT' THEN 'true'
            WHEN pf.name = 'Environments' AND lt.code != 'PLATFORM-ENT' THEN '2'
            WHEN pf.name = 'Environments' AND lt.code = 'PLATFORM-ENT' THEN 'Custom'
            WHEN pf.name = 'Onboarding' THEN 'true'
            WHEN pf.name = 'Platform Maintenance' THEN 'true'
            WHEN pf.name = 'Online Support' AND lt.code != 'PLATFORM-ENT' THEN '8/5'
            WHEN pf.name = 'Online Support' AND lt.code = 'PLATFORM-ENT' THEN '24/7'
        END
    FROM license_types lt
    CROSS JOIN product_features pf
    WHERE lt.product_id = platform_id
    AND pf.product_id = platform_id;

    -- Insert e-Factura product
    INSERT INTO products (name, code, description)
    SELECT 'Timeqode e-Factura', 'EFACTURA', 'Electronic invoicing solution compliant with Romanian fiscal regulations.'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'EFACTURA')
    RETURNING id INTO efactura_id;

    -- Insert e-Factura license types
    IF NOT EXISTS (SELECT 1 FROM license_types WHERE product_id = efactura_id AND code = 'EFACTURA-START') THEN
        INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
        VALUES (efactura_id, 'Starter', 'EFACTURA-START', 100, 50.00, 500.00, 'Up to 100 invoices per month');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM license_types WHERE product_id = efactura_id AND code = 'EFACTURA-BIZ') THEN
        INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
        VALUES (efactura_id, 'Business', 'EFACTURA-BIZ', 1000, 120.00, 1200.00, 'Up to 1000 invoices per month');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM license_types WHERE product_id = efactura_id AND code = 'EFACTURA-UNL') THEN
        INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
        VALUES (efactura_id, 'Unlimited', 'EFACTURA-UNL', NULL, 240.00, 2400.00, 'Unlimited invoices with priority support');
    END IF;

    -- Insert e-Transport product
    INSERT INTO products (name, code, description)
    SELECT 'Timeqode e-Transport', 'ETRANSPORT', 'Transportation management system for tracking and optimizing logistics operations.'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'ETRANSPORT')
    RETURNING id INTO etransport_id;

    -- Insert e-Transport license types
    IF NOT EXISTS (SELECT 1 FROM license_types WHERE product_id = etransport_id AND code = 'ETRANSPORT-BASIC') THEN
        INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
        VALUES (etransport_id, 'Basic', 'ETRANSPORT-BASIC', 100, 80.00, 800.00, 'Up to 100 transports per month');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM license_types WHERE product_id = etransport_id AND code = 'ETRANSPORT-STD') THEN
        INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
        VALUES (etransport_id, 'Standard', 'ETRANSPORT-STD', 1000, 150.00, 1500.00, 'Up to 1000 transports per month');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM license_types WHERE product_id = etransport_id AND code = 'ETRANSPORT-PREM') THEN
        INSERT INTO license_types (product_id, name, code, max_users, monthly_price, yearly_price, description)
        VALUES (etransport_id, 'Premium', 'ETRANSPORT-PREM', NULL, 300.00, 3000.00, 'Unlimited transports with advanced analytics');
    END IF;
END
$$; 