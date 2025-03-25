-- Create project_requests table for tracking project plan requests
CREATE TABLE IF NOT EXISTS project_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  requester_id UUID REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for project_requests
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project requests are viewable by authenticated users"
ON project_requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Project requests can be inserted by authenticated users"
ON project_requests FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Project requests can be updated by authenticated users"
ON project_requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_requests_updated_at
BEFORE UPDATE ON project_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add index on offer_id for faster lookups
CREATE INDEX IF NOT EXISTS project_requests_offer_id_idx ON project_requests(offer_id);

-- Create project_resources table for mapping resources to project requests
CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_request_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  resource_type_id UUID NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  rate DECIMAL(10, 2),
  days INTEGER DEFAULT 0,
  phase VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for project_resources
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project resources are viewable by authenticated users"
ON project_resources FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Project resources can be inserted by authenticated users"
ON project_resources FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Project resources can be updated by authenticated users"
ON project_resources FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at on project_resources
CREATE TRIGGER update_project_resources_updated_at
BEFORE UPDATE ON project_resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create resource_types table for tracking different types of resources
CREATE TABLE IF NOT EXISTS resource_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  rate DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for resource_types
ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resource types are viewable by authenticated users"
ON resource_types FOR SELECT
TO authenticated
USING (true);

-- Insert some initial resource types
INSERT INTO resource_types (name, code, rate) VALUES
('Business Analyst', 'BA', 75.00),
('Developer', 'DEV', 100.00),
('Business Central Consultant', 'BC', 85.00),
('Project Manager', 'PM', 95.00),
('Solution Architect', 'SA', 120.00)
ON CONFLICT (code) DO UPDATE SET rate = EXCLUDED.rate;

-- Create a function to check if a project plan has been requested for an offer
CREATE OR REPLACE FUNCTION has_project_plan_request(offer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM project_requests WHERE offer_id = $1);
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a project plan has been submitted for an offer
CREATE OR REPLACE FUNCTION is_project_plan_submitted(offer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM project_requests WHERE offer_id = $1 AND submitted_at IS NOT NULL);
END;
$$ LANGUAGE plpgsql; 