-- Add Finance & Operations license types
DO $$
DECLARE
    fo_category_id uuid;
BEGIN
    -- Get the Finance & Operations category ID
    SELECT id INTO fo_category_id
    FROM product_categories
    WHERE code = 'FINANCE_AND_OPERATIONS';

    IF fo_category_id IS NULL THEN
        RAISE EXCEPTION 'Finance & Operations category not found';
    END IF;

    -- Delete any existing license types with these codes
    DELETE FROM license_types 
    WHERE code IN (
        'FO_FINANCE_ATTACH',
        'FO_FINANCE',
        'FO_FINANCE_PREMIUM',
        'FO_SCM_ATTACH',
        'FO_SCM',
        'FO_SCM_PREMIUM'
    );

    -- Insert license types for Finance & Operations
    INSERT INTO license_types (id, name, code, description, product_id, monthly_price, yearly_price, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 'Dynamics 365 Finance Attach to Qualifying Dynamics 365 Base Offer', 'FO_FINANCE_ATTACH', 'Finance module as an attachment to existing D365 license', fo_category_id, 30.00, 360.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Finance', 'FO_FINANCE', 'Standard Finance module license', fo_category_id, 180.00, 2160.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Finance Premium', 'FO_FINANCE_PREMIUM', 'Premium Finance module with advanced features', fo_category_id, 240.00, 2880.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Supply Chain Management Attach to Qualifying Dynamics 365 Base Offer', 'FO_SCM_ATTACH', 'Supply Chain Management as an attachment to existing D365 license', fo_category_id, 30.00, 360.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Supply Chain Management', 'FO_SCM', 'Standard Supply Chain Management module license', fo_category_id, 180.00, 2160.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Supply Chain Management Premium', 'FO_SCM_PREMIUM', 'Premium Supply Chain Management with advanced features', fo_category_id, 240.00, 2880.00, NOW(), NOW());
END $$; 