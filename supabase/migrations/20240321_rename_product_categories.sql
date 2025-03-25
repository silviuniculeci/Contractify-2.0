-- Check if tables exist before proceeding
DO $$ 
BEGIN
    -- Rename the product_categories table to solutions if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_categories') THEN
        ALTER TABLE product_categories RENAME TO solutions;
    END IF;

    -- Handle license_types table modifications if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'license_types') THEN
        -- Drop the existing foreign key constraint if it exists
        ALTER TABLE license_types 
            DROP CONSTRAINT IF EXISTS license_types_product_id_fkey;

        -- Rename the column if it exists
        IF EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'license_types' AND column_name = 'product_id') THEN
            ALTER TABLE license_types 
                RENAME COLUMN product_id TO solution_id;
        END IF;

        -- Add the new foreign key constraint
        ALTER TABLE license_types
            ADD CONSTRAINT license_types_solution_id_fkey 
            FOREIGN KEY (solution_id) 
            REFERENCES solutions(id);
    END IF;

    -- Handle RLS policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_categories') THEN
        DROP POLICY IF EXISTS "Enable read access for all users" ON product_categories;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON product_categories;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON product_categories;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON product_categories;
    END IF;

    -- Create new policies on solutions table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'solutions') THEN
        CREATE POLICY "Enable read access for all users" ON solutions
            FOR SELECT USING (true);

        CREATE POLICY "Enable insert for authenticated users only" ON solutions
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Enable update for authenticated users only" ON solutions
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Enable delete for authenticated users only" ON solutions
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$; 