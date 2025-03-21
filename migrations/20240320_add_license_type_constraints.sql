-- Add unique constraint on code column in license_types table
ALTER TABLE license_types ADD CONSTRAINT license_types_code_key UNIQUE (code); 