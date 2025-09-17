-- Add soft delete columns to main tables
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

ALTER TABLE waitlist_entries 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Create indexes for better performance on soft deleted items
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professionals_deleted_at ON professionals(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_deleted_at ON waitlist_entries(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create trash_log table to track all delete operations
CREATE TABLE IF NOT EXISTS trash_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES auth.users(id),
  delete_reason TEXT,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for trash_log
ALTER TABLE trash_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trash from their company" ON trash_log
  FOR SELECT USING (user_has_company_access(company_id));

CREATE POLICY "Users can insert trash from their company" ON trash_log
  FOR INSERT WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update trash from their company" ON trash_log
  FOR UPDATE USING (user_has_company_access(company_id));

-- Create function to soft delete with logging
CREATE OR REPLACE FUNCTION soft_delete_record(
  p_table_name TEXT,
  p_record_id UUID,
  p_delete_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  record_data JSONB;
  company_id_val UUID;
  user_id_val UUID;
  sql_query TEXT;
BEGIN
  -- Get current user
  user_id_val := auth.uid();
  
  -- Get company ID for the user
  company_id_val := get_user_company_id();
  
  -- Get the record data before deletion
  sql_query := format('SELECT to_jsonb(t.*) FROM %I t WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL', p_table_name);
  EXECUTE sql_query INTO record_data USING p_record_id, company_id_val;
  
  IF record_data IS NULL THEN
    RETURN FALSE; -- Record not found or already deleted
  END IF;
  
  -- Soft delete the record
  sql_query := format('UPDATE %I SET deleted_at = NOW(), deleted_by = $1, delete_reason = $2 WHERE id = $3 AND company_id = $4', p_table_name);
  EXECUTE sql_query USING user_id_val, p_delete_reason, p_record_id, company_id_val;
  
  -- Log the deletion
  INSERT INTO trash_log (company_id, table_name, record_id, record_data, deleted_by, delete_reason)
  VALUES (company_id_val, p_table_name, p_record_id, record_data, user_id_val, p_delete_reason);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore soft deleted record
CREATE OR REPLACE FUNCTION restore_record(
  p_table_name TEXT,
  p_record_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  user_id_val UUID;
  company_id_val UUID;
  sql_query TEXT;
BEGIN
  -- Get current user
  user_id_val := auth.uid();
  
  -- Get company ID for the user
  company_id_val := get_user_company_id();
  
  -- Restore the record
  sql_query := format('UPDATE %I SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE id = $1 AND company_id = $2', p_table_name);
  EXECUTE sql_query USING p_record_id, company_id_val;
  
  -- Update trash log
  UPDATE trash_log 
  SET restored_at = NOW(), restored_by = user_id_val
  WHERE table_name = p_table_name AND record_id = p_record_id AND company_id = company_id_val;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to permanently delete record
CREATE OR REPLACE FUNCTION permanent_delete_record(
  p_table_name TEXT,
  p_record_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  company_id_val UUID;
  sql_query TEXT;
BEGIN
  -- Get company ID for the user
  company_id_val := get_user_company_id();
  
  -- Permanently delete the record
  sql_query := format('DELETE FROM %I WHERE id = $1 AND company_id = $2 AND deleted_at IS NOT NULL', p_table_name);
  EXECUTE sql_query USING p_record_id, company_id_val;
  
  -- Remove from trash log
  DELETE FROM trash_log 
  WHERE table_name = p_table_name AND record_id = p_record_id AND company_id = company_id_val;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to auto-cleanup old trash (30 days)
CREATE OR REPLACE FUNCTION cleanup_old_trash() RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER := 0;
  trash_record RECORD;
BEGIN
  -- Get records older than 30 days
  FOR trash_record IN 
    SELECT table_name, record_id 
    FROM trash_log 
    WHERE deleted_at < NOW() - INTERVAL '30 days' 
    AND restored_at IS NULL
  LOOP
    -- Permanently delete the record
    PERFORM permanent_delete_record(trash_record.table_name, trash_record.record_id);
    cleanup_count := cleanup_count + 1;
  END LOOP;
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Update existing views to exclude soft deleted records
CREATE OR REPLACE VIEW active_appointments AS
SELECT * FROM appointments WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_professionals AS
SELECT * FROM professionals WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_services AS
SELECT * FROM services WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_waitlist_entries AS
SELECT * FROM waitlist_entries WHERE deleted_at IS NULL;
