-- Create a function to check role updates
CREATE OR REPLACE FUNCTION check_role_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow role updates if the user is a sales_manager
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'sales_manager'
    ) THEN
        RETURN NEW;
    END IF;

    -- For all other users, prevent role changes
    IF NEW.role != OLD.role THEN
        RAISE EXCEPTION 'Only sales managers can update user roles';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER protect_role_updates
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_role_update(); 