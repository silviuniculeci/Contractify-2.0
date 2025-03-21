-- Create the user_role enum type
CREATE TYPE user_role AS ENUM (
  'sales',
  'sales_support',
  'operational',
  'sales_manager',
  'marketing'
);

-- Create the users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to read their own data
CREATE POLICY "Users can view own user data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own data (except role)
CREATE POLICY "Users can update own user data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow sales_manager to view all users
CREATE POLICY "Sales managers can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sales_manager'
    )
  );

-- Allow sales_manager to update all users
CREATE POLICY "Sales managers can update all users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sales_manager'
    )
  );

-- Create indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role); 