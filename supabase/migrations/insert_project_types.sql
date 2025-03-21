-- Insert project types
INSERT INTO project_types (id, name, code, description, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Project Implementation', 'IMPLEMENTATION', 'Project Implementation type', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Project Localization', 'LOCALIZATION', 'Project Localization type', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Link project types to products
INSERT INTO product_project_types (product_id, project_type_id)
VALUES 
  -- Timeqode only has Project Implementation
  ((SELECT id FROM products WHERE code = 'TIMEQODE'), (SELECT id FROM project_types WHERE name = 'Project Implementation')),
  
  -- Business Central has both types
  ((SELECT id FROM products WHERE code = 'BC'), (SELECT id FROM project_types WHERE name = 'Project Implementation')),
  ((SELECT id FROM products WHERE code = 'BC'), (SELECT id FROM project_types WHERE name = 'Project Localization')),
  
  -- Finance and Operations has both types
  ((SELECT id FROM products WHERE code = 'FO'), (SELECT id FROM project_types WHERE name = 'Project Implementation')),
  ((SELECT id FROM products WHERE code = 'FO'), (SELECT id FROM project_types WHERE name = 'Project Localization'))
ON CONFLICT (product_id, project_type_id) DO NOTHING; 