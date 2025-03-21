-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    product_category_id UUID REFERENCES product_categories(id),
    price DECIMAL(10, 2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default products
DO $$
DECLARE
    bc_category_id UUID;
    fo_category_id UUID;
    timeqode_category_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO bc_category_id FROM product_categories WHERE code = 'BUSINESS_CENTRAL';
    SELECT id INTO fo_category_id FROM product_categories WHERE code = 'FINANCE_AND_OPERATIONS';
    SELECT id INTO timeqode_category_id FROM product_categories WHERE code = 'TIMEQODE';

    -- Insert default products
    INSERT INTO products (name, code, description, product_category_id, active, created_at, updated_at)
    VALUES
        ('Microsoft Dynamics 365 Business Central', 'D365_BC', 'Business Central ERP solution', bc_category_id, true, NOW(), NOW()),
        ('Microsoft Dynamics 365 Finance & Operations', 'D365_FO', 'Finance & Operations ERP solution', fo_category_id, true, NOW(), NOW()),
        ('Timeqode Suite', 'TIMEQODE_SUITE', 'Timeqode business solutions suite', timeqode_category_id, true, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING;
END $$; 