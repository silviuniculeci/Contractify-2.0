-- Insert default products
INSERT INTO products (id, name, code, description, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Timeqode', 'TIMEQODE', 'Timeqode product', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Business Central', 'BC', 'Business Central product', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Finance and Operations', 'FO', 'Finance and Operations product', NOW(), NOW())
ON CONFLICT (code) DO NOTHING; 