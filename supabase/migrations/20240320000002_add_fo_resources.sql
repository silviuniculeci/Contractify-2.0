-- Get the Finance and Operations solution ID and add the rates
WITH fo_solution AS (
  SELECT id FROM solutions WHERE code = 'FINANCE_AND_OPERATIONS'
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
  fo_solution.id,
  resource_types_ids.id,
  CASE resource_types_ids.code
    WHEN 'BUSINESS_CONSULTANT' THEN 640.0 / 8  -- Converting daily rate to hourly
    WHEN 'BUSINESS_ANALYST' THEN 640.0 / 8
    WHEN 'TECHNICAL_CONSULTANT' THEN 640.0 / 8
    WHEN 'QUALITY_ASSURANCE' THEN 700.0 / 8
    WHEN 'PROJECT_MANAGER' THEN 640.0 / 8
  END,
  now()
FROM fo_solution, resource_types_ids
ON CONFLICT (solution_id, resource_type_id) DO UPDATE
SET rate_per_hour = EXCLUDED.rate_per_hour; 