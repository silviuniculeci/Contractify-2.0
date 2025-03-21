-- First, get the Business Central product category ID
DO $$
DECLARE
    bc_category_id uuid;
BEGIN
    -- Get the Business Central category ID
    SELECT id INTO bc_category_id
    FROM product_categories
    WHERE code = 'BUSINESS_CENTRAL';

    -- Insert license types for Business Central
    INSERT INTO license_types (id, name, code, description, product_id, monthly_price, yearly_price, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 'Dynamics 365 Business Central Essentials', 'BC_ESSENTIALS', 'Business Central Essentials License', bc_category_id, 89.60, 1075.20, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Premium', 'BC_PREMIUM', 'Business Central Premium License', bc_category_id, 127.40, 1528.80, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Team Members', 'BC_TEAM_MEMBERS', 'Business Central Team Members License', bc_category_id, 8.40, 100.80, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Device', 'BC_DEVICE', 'Business Central Device License', bc_category_id, 50.00, 600.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Additional Environment Addon', 'BC_ADD_ENV', 'Business Central Additional Environment', bc_category_id, 50.00, 600.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central External Accountant', 'BC_EXT_ACCOUNTANT', 'Business Central External Accountant License', bc_category_id, 0.00, 0.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Essentials Attach', 'BC_ESSENTIALS_ATTACH', 'Business Central Essentials Attach License', bc_category_id, 44.80, 537.60, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Database Capacity', 'BC_DB_CAPACITY', 'Business Central Database Capacity', bc_category_id, 50.00, 600.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Database Capacity Overage', 'BC_DB_OVERAGE', 'Business Central Database Capacity Overage', bc_category_id, 50.00, 600.00, NOW(), NOW()),
        (uuid_generate_v4(), 'Dynamics 365 Business Central Database Capacity 100GB', 'BC_DB_100GB', 'Business Central Database Capacity 100GB', bc_category_id, 50.00, 600.00, NOW(), NOW());
END $$; 