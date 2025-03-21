-- Add product categories if they don't exist
INSERT INTO product_categories (id, name, code, description, created_at, updated_at)
VALUES
    (uuid_generate_v4(), 'Business Central', 'BUSINESS_CENTRAL', 'Microsoft Dynamics 365 Business Central', NOW(), NOW()),
    (uuid_generate_v4(), 'Finance & Operations', 'FINANCE_AND_OPERATIONS', 'Microsoft Dynamics 365 Finance & Operations', NOW(), NOW()),
    (uuid_generate_v4(), 'Timeqode', 'TIMEQODE', 'Timeqode Solutions', NOW(), NOW())
ON CONFLICT (code) DO NOTHING; 