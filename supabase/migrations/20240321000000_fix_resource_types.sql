-- Drop previous constraints/indexes if they exist
DROP TRIGGER IF EXISTS update_resource_types_updated_at ON resource_types;

-- Alter the resource_types table to ensure it has the correct columns
DO $$
BEGIN
    -- Add rate column if it doesn't exist, rename hourly_rate to rate if it exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'resource_types' AND column_name = 'hourly_rate'
    ) THEN
        ALTER TABLE resource_types RENAME COLUMN hourly_rate TO rate;
    ELSIF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'resource_types' AND column_name = 'rate'
    ) THEN
        ALTER TABLE resource_types ADD COLUMN rate DECIMAL(10, 2);
    END IF;
    
    -- Make sure updated_at column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'resource_types' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE resource_types ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        
        -- Create or recreate the updated_at trigger
        CREATE TRIGGER update_resource_types_updated_at
        BEFORE UPDATE ON resource_types
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert or update resource types with rate values
INSERT INTO resource_types (name, code, rate)
VALUES 
('Business Analyst', 'BA', 75.00),
('Developer', 'DEV', 100.00),
('Business Central Consultant', 'BC', 85.00),
('Project Manager', 'PM', 95.00),
('Solution Architect', 'SA', 120.00)
ON CONFLICT (code) DO UPDATE 
SET rate = EXCLUDED.rate,
    updated_at = NOW(); 