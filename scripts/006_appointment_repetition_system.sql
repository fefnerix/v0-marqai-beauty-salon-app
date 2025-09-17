-- Add repetition columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS repetition_type VARCHAR(20) DEFAULT 'none' CHECK (repetition_type IN ('none', 'weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS repetition_end_date DATE,
ADD COLUMN IF NOT EXISTS repetition_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_recurring_parent BOOLEAN DEFAULT false;

-- Create index for better performance on recurring appointments
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON appointments(is_recurring_parent) WHERE is_recurring_parent = true;

-- Create function to generate recurring appointments
CREATE OR REPLACE FUNCTION generate_recurring_appointments(
  p_appointment_id UUID,
  p_repetition_type VARCHAR(20),
  p_repetition_count INTEGER,
  p_repetition_end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  base_appointment RECORD;
  new_date DATE;
  interval_days INTEGER;
  created_count INTEGER := 0;
  i INTEGER;
BEGIN
  -- Get the base appointment
  SELECT * INTO base_appointment FROM appointments WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Mark the original appointment as recurring parent
  UPDATE appointments 
  SET is_recurring_parent = true,
      repetition_type = p_repetition_type,
      repetition_count = p_repetition_count,
      repetition_end_date = p_repetition_end_date
  WHERE id = p_appointment_id;
  
  -- Determine interval based on repetition type
  CASE p_repetition_type
    WHEN 'weekly' THEN interval_days := 7;
    WHEN 'biweekly' THEN interval_days := 14;
    WHEN 'monthly' THEN interval_days := 30;
    ELSE RETURN 0;
  END CASE;
  
  -- Generate recurring appointments
  FOR i IN 1..COALESCE(p_repetition_count - 1, 0) LOOP
    new_date := base_appointment.start_time::DATE + (interval_days * i);
    
    -- Stop if we've reached the end date
    IF p_repetition_end_date IS NOT NULL AND new_date > p_repetition_end_date THEN
      EXIT;
    END IF;
    
    -- Create the recurring appointment
    INSERT INTO appointments (
      company_id,
      professional_id,
      service_id,
      client_name,
      client_phone,
      start_time,
      end_time,
      status,
      notes,
      price,
      parent_appointment_id,
      repetition_type
    ) VALUES (
      base_appointment.company_id,
      base_appointment.professional_id,
      base_appointment.service_id,
      base_appointment.client_name,
      base_appointment.client_phone,
      (new_date + base_appointment.start_time::TIME)::TIMESTAMP,
      (new_date + base_appointment.end_time::TIME)::TIMESTAMP,
      'scheduled',
      base_appointment.notes,
      base_appointment.price,
      p_appointment_id,
      'none' -- Child appointments are not recurring themselves
    );
    
    created_count := created_count + 1;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update recurring series
CREATE OR REPLACE FUNCTION update_recurring_series(
  p_parent_id UUID,
  p_update_type VARCHAR(20), -- 'this_only', 'this_and_future', 'all'
  p_appointment_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  target_appointment RECORD;
BEGIN
  -- Get the target appointment
  SELECT * INTO target_appointment FROM appointments 
  WHERE id = p_parent_id OR parent_appointment_id = p_parent_id;
  
  CASE p_update_type
    WHEN 'this_only' THEN
      -- Update only the specific appointment
      UPDATE appointments 
      SET 
        client_name = COALESCE((p_appointment_data->>'client_name')::TEXT, client_name),
        client_phone = COALESCE((p_appointment_data->>'client_phone')::TEXT, client_phone),
        notes = COALESCE((p_appointment_data->>'notes')::TEXT, notes),
        price = COALESCE((p_appointment_data->>'price')::DECIMAL, price)
      WHERE id = p_parent_id;
      updated_count := 1;
      
    WHEN 'this_and_future' THEN
      -- Update this appointment and all future ones in the series
      UPDATE appointments 
      SET 
        client_name = COALESCE((p_appointment_data->>'client_name')::TEXT, client_name),
        client_phone = COALESCE((p_appointment_data->>'client_phone')::TEXT, client_phone),
        notes = COALESCE((p_appointment_data->>'notes')::TEXT, notes),
        price = COALESCE((p_appointment_data->>'price')::DECIMAL, price)
      WHERE (id = p_parent_id OR parent_appointment_id = p_parent_id)
        AND start_time >= (SELECT start_time FROM appointments WHERE id = p_parent_id);
      GET DIAGNOSTICS updated_count = ROW_COUNT;
      
    WHEN 'all' THEN
      -- Update all appointments in the series
      UPDATE appointments 
      SET 
        client_name = COALESCE((p_appointment_data->>'client_name')::TEXT, client_name),
        client_phone = COALESCE((p_appointment_data->>'client_phone')::TEXT, client_phone),
        notes = COALESCE((p_appointment_data->>'notes')::TEXT, notes),
        price = COALESCE((p_appointment_data->>'price')::DECIMAL, price)
      WHERE id = p_parent_id OR parent_appointment_id = p_parent_id;
      GET DIAGNOSTICS updated_count = ROW_COUNT;
  END CASE;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete recurring series
CREATE OR REPLACE FUNCTION delete_recurring_series(
  p_appointment_id UUID,
  p_delete_type VARCHAR(20) -- 'this_only', 'this_and_future', 'all'
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  parent_id UUID;
BEGIN
  -- Find the parent appointment ID
  SELECT COALESCE(parent_appointment_id, id) INTO parent_id 
  FROM appointments WHERE id = p_appointment_id;
  
  CASE p_delete_type
    WHEN 'this_only' THEN
      -- Delete only the specific appointment
      DELETE FROM appointments WHERE id = p_appointment_id;
      deleted_count := 1;
      
    WHEN 'this_and_future' THEN
      -- Delete this appointment and all future ones in the series
      DELETE FROM appointments 
      WHERE (id = parent_id OR parent_appointment_id = parent_id)
        AND start_time >= (SELECT start_time FROM appointments WHERE id = p_appointment_id);
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
    WHEN 'all' THEN
      -- Delete all appointments in the series
      DELETE FROM appointments 
      WHERE id = parent_id OR parent_appointment_id = parent_id;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
  END CASE;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
