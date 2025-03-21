-- Create offer_licenses table
CREATE TABLE IF NOT EXISTS offer_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    license_type_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    annual_commitment BOOLEAN DEFAULT false,
    monthly_payment BOOLEAN DEFAULT false,
    discount DECIMAL(5,2) DEFAULT 0,
    total_value DECIMAL(10,2) NOT NULL,
    margin_value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE offer_licenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own offer licenses" ON offer_licenses;
DROP POLICY IF EXISTS "Users can insert their own offer licenses" ON offer_licenses;
DROP POLICY IF EXISTS "Users can update their own offer licenses" ON offer_licenses;
DROP POLICY IF EXISTS "Users can delete their own offer licenses" ON offer_licenses;

-- Create new policies
CREATE POLICY "Users can view their own offer licenses"
    ON offer_licenses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM offers
            WHERE offers.id = offer_licenses.offer_id
            AND offers.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own offer licenses"
    ON offer_licenses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM offers
            WHERE offers.id = offer_licenses.offer_id
            AND offers.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own offer licenses"
    ON offer_licenses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM offers
            WHERE offers.id = offer_licenses.offer_id
            AND offers.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own offer licenses"
    ON offer_licenses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM offers
            WHERE offers.id = offer_licenses.offer_id
            AND offers.created_by = auth.uid()
        )
    ); 