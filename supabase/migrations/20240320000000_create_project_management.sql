-- Create roles table
create table roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default now()
);

-- Create user roles junction table
create table user_roles (
  user_id uuid references auth.users(id),
  role_id uuid references roles(id),
  primary key (user_id, role_id)
);

-- Create resource types table
create table resource_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  rate decimal(10, 2),
  created_at timestamp with time zone default now()
);

-- Create solution-specific resource rates
create table solution_resource_rates (
  id uuid primary key default uuid_generate_v4(),
  solution_id uuid references solutions(id),
  resource_type_id uuid references resource_types(id),
  rate_per_hour numeric not null,
  created_at timestamp with time zone default now(),
  unique(solution_id, resource_type_id)
);

-- Create project requests table
create table project_requests (
  id uuid primary key default uuid_generate_v4(),
  offer_id uuid references offers(id),
  solution_id uuid references solutions(id),
  status text not null default 'Pending',
  requested_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create project resources table
create table project_resources (
  id uuid primary key default uuid_generate_v4(),
  project_request_id uuid references project_requests(id),
  resource_type_id uuid references resource_types(id),
  hours numeric not null,
  rate_per_hour numeric not null,
  total_cost numeric not null,
  created_at timestamp with time zone default now()
);

-- Insert initial roles
insert into roles (name, code) values
  ('Sales Person', 'SALES_PERSON'),
  ('Sales Manager', 'SALES_MANAGER'),
  ('Operational Manager', 'OPERATIONAL_MANAGER');

-- Insert resource types
insert into resource_types (name, code) values
  ('Business Consultant', 'BUSINESS_CONSULTANT'),
  ('Business Analyst', 'BUSINESS_ANALYST'),
  ('Technical Consultant', 'TECHNICAL_CONSULTANT'),
  ('Quality Assurance', 'QUALITY_ASSURANCE'),
  ('Project Manager', 'PROJECT_MANAGER');

-- Insert rates for Business Central
insert into solution_resource_rates (solution_id, resource_type_id, rate_per_hour)
select 
  s.id,
  rt.id,
  case rt.code
    when 'BUSINESS_CONSULTANT' then 520
    when 'BUSINESS_ANALYST' then 600
    when 'TECHNICAL_CONSULTANT' then 520
    when 'QUALITY_ASSURANCE' then 700
    when 'PROJECT_MANAGER' then 600
  end
from solutions s, resource_types rt
where s.code = 'BUSINESS_CENTRAL';

-- Insert rates for Finance & Operations
insert into solution_resource_rates (solution_id, resource_type_id, rate_per_hour)
select 
  s.id,
  rt.id,
  case rt.code
    when 'BUSINESS_CONSULTANT' then 640
    when 'BUSINESS_ANALYST' then 640
    when 'TECHNICAL_CONSULTANT' then 640
    when 'QUALITY_ASSURANCE' then 700
    when 'PROJECT_MANAGER' then 640
  end
from solutions s, resource_types rt
where s.code = 'FINANCE_AND_OPERATIONS'; 