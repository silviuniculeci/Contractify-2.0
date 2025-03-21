-- Drop existing table and types if they exist
DROP TABLE IF EXISTS offers;
DROP TYPE IF EXISTS contract_type;
DROP TYPE IF EXISTS cost_center;
DROP TYPE IF EXISTS offer_status;

-- Create enum types
CREATE TYPE contract_type AS ENUM ('Implementation', 'Support', 'License');
CREATE TYPE cost_center AS ENUM ('AROGO');
CREATE TYPE offer_status AS ENUM ('Draft', 'Pending Approval', 'Approved', 'Rejected');

-- Create the offers table
CREATE TABLE offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    cui TEXT NOT NULL,
    order_date DATE,
    sales_person TEXT NOT NULL,
    contract_type contract_type NOT NULL,
    cost_center cost_center NOT NULL DEFAULT 'AROGO',
    project_description TEXT,
    go_live_date DATE,
    approver TEXT,
    approval_date DATE,
    status offer_status NOT NULL DEFAULT 'Draft',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own offers" ON offers;
DROP POLICY IF EXISTS "Users can insert their own offers" ON offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON offers;

-- Policy for viewing offers - more permissive for testing
CREATE POLICY "Users can view offers"
    ON offers
    FOR SELECT
    USING (true);

-- Policy for inserting offers - more permissive for testing
CREATE POLICY "Users can insert offers"
    ON offers
    FOR INSERT
    WITH CHECK (true);

-- Policy for updating offers
CREATE POLICY "Users can update their own offers"
    ON offers
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Drop existing index if it exists
DROP INDEX IF EXISTS offers_created_by_idx;

-- Create an index on created_by for better query performance
CREATE INDEX offers_created_by_idx ON offers(created_by);

-- Create or replace the function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create users table if it doesn't exist
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create simplified RLS policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (new.id, new.email, '', '');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index on id
CREATE INDEX IF NOT EXISTS users_id_idx ON users(id); 