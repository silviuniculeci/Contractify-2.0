-- Products table to store different Timeqode software products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product features table
CREATE TABLE product_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- License types table (e.g., Basic, Professional, Enterprise)
CREATE TABLE license_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    max_users INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, code)
);

-- License features mapping
CREATE TABLE license_features (
    license_type_id UUID REFERENCES license_types(id),
    feature_id UUID REFERENCES product_features(id),
    PRIMARY KEY (license_type_id, feature_id)
);

-- Set up RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
CREATE POLICY "Everyone can view products"
  ON products
  FOR SELECT
  USING (true);

-- Admin can manage products
CREATE POLICY "Admin can manage products"
  ON products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Similar policies for other tables
CREATE POLICY "Everyone can view product features"
  ON product_features
  FOR SELECT
  USING (true);

CREATE POLICY "Everyone can view license types"
  ON license_types
  FOR SELECT
  USING (true);

CREATE POLICY "Everyone can view license features"
  ON license_features
  FOR SELECT
  USING (true);

-- Insert initial products
INSERT INTO products (name, code, description) VALUES
('Timeqode Platform', 'PLATFORM', 'No-code development platform for building business applications quickly and efficiently.'),
('Timeqode e-Factura', 'EFACTURA', 'Electronic invoicing solution compliant with Romanian fiscal regulations.'),
('Timeqode e-Transport', 'ETRANSPORT', 'Transportation management system for tracking and optimizing logistics operations.');

-- Insert license types for Timeqode Platform
INSERT INTO license_types (product_id, name, code, description, duration_months, base_price, max_users) VALUES
((SELECT id FROM products WHERE code = 'PLATFORM'), 'Basic', 'PLATFORM-BASIC', 'Entry-level license with essential features', 12, 1000.00, 5),
((SELECT id FROM products WHERE code = 'PLATFORM'), 'Professional', 'PLATFORM-PRO', 'Advanced features for growing businesses', 12, 2500.00, 20),
((SELECT id FROM products WHERE code = 'PLATFORM'), 'Enterprise', 'PLATFORM-ENT', 'Full feature set with premium support', 12, 5000.00, 50);

-- Insert license types for e-Factura
INSERT INTO license_types (product_id, name, code, description, duration_months, base_price, max_users) VALUES
((SELECT id FROM products WHERE code = 'EFACTURA'), 'Starter', 'EFACTURA-START', 'Up to 100 invoices per month', 12, 500.00, 100),
((SELECT id FROM products WHERE code = 'EFACTURA'), 'Business', 'EFACTURA-BIZ', 'Up to 1000 invoices per month', 12, 1200.00, 1000),
((SELECT id FROM products WHERE code = 'EFACTURA'), 'Unlimited', 'EFACTURA-UNL', 'Unlimited invoices with priority support', 12, 2400.00, NULL);

-- Insert license types for e-Transport
INSERT INTO license_types (product_id, name, code, description, duration_months, base_price, max_users) VALUES
((SELECT id FROM products WHERE code = 'ETRANSPORT'), 'Basic', 'ETRANSPORT-BASIC', 'Up to 100 transports per month', 12, 800.00, 100),
((SELECT id FROM products WHERE code = 'ETRANSPORT'), 'Standard', 'ETRANSPORT-STD', 'Up to 1000 transports per month', 12, 1500.00, 1000),
((SELECT id FROM products WHERE code = 'ETRANSPORT'), 'Premium', 'ETRANSPORT-PREM', 'Unlimited transports with advanced analytics', 12, 3000.00, NULL);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_types_updated_at
  BEFORE UPDATE ON license_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 