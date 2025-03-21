-- Create enum types
CREATE TYPE offer_status AS ENUM (
  'Draft',
  'Pending Approval',
  'Approved',
  'Rejected'
);

CREATE TYPE contract_type AS ENUM (
  'Implementation',
  'Maintenance',
  'Support',
  'Consulting'
);

CREATE TYPE cost_center AS ENUM (
  'AROGO',
  'CORPORATE',
  'LOGISTICS',
  'IT'
);

-- Create offers table
CREATE TABLE offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  cui TEXT NOT NULL,
  order_date DATE,
  sales_person TEXT NOT NULL,
  contract_type contract_type NOT NULL,
  cost_center cost_center NOT NULL,
  project_description TEXT,
  go_live_date DATE,
  approver TEXT,
  approval_date DATE,
  status offer_status NOT NULL DEFAULT 'Draft',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set up RLS policies
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Sales can create and view their own offers
CREATE POLICY "Sales can manage their own offers"
  ON offers
  FOR ALL
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sales'
    )
  );

-- Sales support can view and edit all offers
CREATE POLICY "Sales support can view and edit all offers"
  ON offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sales_support'
    )
  );

-- Sales managers can manage all offers
CREATE POLICY "Sales managers can manage all offers"
  ON offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sales_manager'
    )
  );

-- Operational can view all offers
CREATE POLICY "Operational can view all offers"
  ON offers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'operational'
    )
  );

-- Create indexes
CREATE INDEX offers_created_by_idx ON offers(created_by);
CREATE INDEX offers_status_idx ON offers(status);
CREATE INDEX offers_customer_name_idx ON offers(customer_name);
CREATE INDEX offers_order_date_idx ON offers(order_date); 