-- First, let's insert the resource types if they don't exist
INSERT INTO resource_types (id, name, code, rate, created_at)
VALUES 
  (gen_random_uuid(), 'Business Consultant', 'BUSINESS_CONSULTANT', 65.0, now()),
  (gen_random_uuid(), 'Business Analyst', 'BUSINESS_ANALYST', 75.0, now()),
  (gen_random_uuid(), 'Technical Consultant', 'TECHNICAL_CONSULTANT', 65.0, now()),
  (gen_random_uuid(), 'Quality Assurance', 'QUALITY_ASSURANCE', 87.5, now()),
  (gen_random_uuid(), 'Project Manager', 'PROJECT_MANAGER', 75.0, now())
ON CONFLICT (code) DO NOTHING;

-- Now, let's get the Business Central solution ID and add the rates
WITH bc_solution AS (
  SELECT id FROM solutions WHERE code = 'BUSINESS_CENTRAL'
),
resource_types_ids AS (
  SELECT id, code FROM resource_types
  WHERE code IN (
    'BUSINESS_CONSULTANT',
    'BUSINESS_ANALYST',
    'TECHNICAL_CONSULTANT',
    'QUALITY_ASSURANCE',
    'PROJECT_MANAGER'
  )
)
INSERT INTO solution_resource_rates (id, solution_id, resource_type_id, rate_per_hour, created_at)
SELECT 
  gen_random_uuid(),
  bc_solution.id,
  resource_types_ids.id,
  CASE resource_types_ids.code
    WHEN 'BUSINESS_CONSULTANT' THEN 520.0 / 8  -- Converting daily rate to hourly
    WHEN 'BUSINESS_ANALYST' THEN 600.0 / 8
    WHEN 'TECHNICAL_CONSULTANT' THEN 520.0 / 8
    WHEN 'QUALITY_ASSURANCE' THEN 700.0 / 8
    WHEN 'PROJECT_MANAGER' THEN 600.0 / 8
  END,
  now()
FROM bc_solution, resource_types_ids
ON CONFLICT (solution_id, resource_type_id) DO UPDATE
SET rate_per_hour = EXCLUDED.rate_per_hour; 