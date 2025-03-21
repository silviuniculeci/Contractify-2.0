-- Step 1: Drop the existing constraint on contract_type
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_contract_type_check;

-- Step 2: Modify the contract_type column to be text without ENUM constraints
ALTER TABLE offers ALTER COLUMN contract_type TYPE text;

-- Step 3: Make sure the project_type_id column exists (add it if it doesn't)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offers' AND column_name = 'project_type_id'
    ) THEN
        ALTER TABLE offers ADD COLUMN project_type_id uuid REFERENCES project_types(id);
    END IF;
END $$;

-- Step 4: Update the RLS policies to include project_type_id
DROP POLICY IF EXISTS "Users can view their own offers" ON offers;
CREATE POLICY "Users can view their own offers" ON offers 
    FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert their own offers" ON offers;
CREATE POLICY "Users can insert their own offers" ON offers 
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own offers" ON offers;
CREATE POLICY "Users can update their own offers" ON offers 
    FOR UPDATE USING (auth.uid() = created_by);

-- Step 5: Add an index on project_type_id for better performance
CREATE INDEX IF NOT EXISTS offers_project_type_id_idx ON offers(project_type_id); 