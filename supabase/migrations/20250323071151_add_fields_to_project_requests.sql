-- Add requested_by and assigned_to columns to project_requests
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES auth.users(id);
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Add an index for better performance on lookups
CREATE INDEX IF NOT EXISTS project_requests_requested_by_idx ON project_requests(requested_by);
CREATE INDEX IF NOT EXISTS project_requests_assigned_to_idx ON project_requests(assigned_to);

-- Add solution_id column if it doesn't exist yet
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS solution_id UUID REFERENCES solutions(id);
CREATE INDEX IF NOT EXISTS project_requests_solution_id_idx ON project_requests(solution_id); 