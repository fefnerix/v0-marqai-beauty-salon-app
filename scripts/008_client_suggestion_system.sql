-- Create clients table for better client management
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  preferred_professional_id UUID REFERENCES professionals(id),
  preferred_time_slots JSONB, -- Array of preferred time slots like [{"day": "monday", "hour": 14}, ...]
  last_appointment_date TIMESTAMP WITH TIME ZONE,
  total_appointments INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_interval_days INTEGER, -- Average days between appointments
  preferred_services UUID[], -- Array of preferred service IDs
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  delete_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_preferred_professional ON clients(preferred_professional_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create client preferences table for more detailed preferences
CREATE TABLE IF NOT EXISTS client_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL, -- 'time_slot', 'professional', 'service', 'day_of_week'
  preference_value JSONB NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0, -- Preference strength (0.0 to 1.0)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, preference_type, preference_value)
);

-- Create client suggestions table to track suggestions made
CREATE TABLE IF NOT EXISTS client_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  suggested_time TIMESTAMP WITH TIME ZONE NOT NULL,
  suggestion_reason TEXT,
  confidence_score DECIMAL(3,2), -- 0.0 to 1.0
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view clients from their company" ON clients
  FOR SELECT USING (user_has_company_access(company_id));

CREATE POLICY "Users can insert clients to their company" ON clients
  FOR INSERT WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "Users can update clients from their company" ON clients
  FOR UPDATE USING (user_has_company_access(company_id));

CREATE POLICY "Users can view client preferences from their company" ON client_preferences
  FOR SELECT USING (user_has_company_access(company_id));

CREATE POLICY "Users can manage client preferences from their company" ON client_preferences
  FOR ALL USING (user_has_company_access(company_id));

CREATE POLICY "Users can view client suggestions from their company" ON client_suggestions
  FOR SELECT USING (user_has_company_access(company_id));

CREATE POLICY "Users can manage client suggestions from their company" ON client_suggestions
  FOR ALL USING (user_has_company_access(company_id));

-- Function to update client statistics
CREATE OR REPLACE FUNCTION update_client_stats(p_client_id UUID) RETURNS VOID AS $$
DECLARE
  client_record RECORD;
  avg_interval INTEGER;
BEGIN
  -- Get client's appointment history
  SELECT 
    COUNT(*) as total_appointments,
    COALESCE(SUM(price), 0) as total_spent,
    MAX(start_time) as last_appointment_date
  INTO client_record
  FROM appointments 
  WHERE client_phone = (SELECT phone FROM clients WHERE id = p_client_id)
    AND status IN ('completed', 'scheduled')
    AND deleted_at IS NULL;

  -- Calculate average interval between appointments
  SELECT AVG(EXTRACT(days FROM (start_time - LAG(start_time) OVER (ORDER BY start_time))))::INTEGER
  INTO avg_interval
  FROM appointments 
  WHERE client_phone = (SELECT phone FROM clients WHERE id = p_client_id)
    AND status = 'completed'
    AND deleted_at IS NULL;

  -- Update client record
  UPDATE clients 
  SET 
    total_appointments = client_record.total_appointments,
    total_spent = client_record.total_spent,
    last_appointment_date = client_record.last_appointment_date,
    average_interval_days = avg_interval,
    updated_at = NOW()
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate client suggestions for empty slots
CREATE OR REPLACE FUNCTION generate_client_suggestions(
  p_professional_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  client_id UUID,
  client_name VARCHAR(255),
  client_phone VARCHAR(20),
  confidence_score DECIMAL(3,2),
  suggestion_reason TEXT
) AS $$
DECLARE
  company_id_val UUID;
  slot_day_of_week INTEGER;
  slot_hour INTEGER;
BEGIN
  -- Get company ID
  SELECT company_id INTO company_id_val FROM professionals WHERE id = p_professional_id;
  
  -- Extract day of week and hour from the time slot
  slot_day_of_week := EXTRACT(dow FROM p_start_time); -- 0=Sunday, 1=Monday, etc.
  slot_hour := EXTRACT(hour FROM p_start_time);
  
  RETURN QUERY
  WITH client_scores AS (
    SELECT 
      c.id as client_id,
      c.name as client_name,
      c.phone as client_phone,
      (
        -- Base score
        0.3 +
        -- Preferred professional bonus
        CASE WHEN c.preferred_professional_id = p_professional_id THEN 0.3 ELSE 0.0 END +
        -- Time preference bonus (check if client has appointments at similar times)
        CASE WHEN EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.client_phone = c.phone 
            AND EXTRACT(hour FROM a.start_time) BETWEEN slot_hour - 1 AND slot_hour + 1
            AND a.status = 'completed'
        ) THEN 0.2 ELSE 0.0 END +
        -- Day preference bonus
        CASE WHEN EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.client_phone = c.phone 
            AND EXTRACT(dow FROM a.start_time) = slot_day_of_week
            AND a.status = 'completed'
        ) THEN 0.15 ELSE 0.0 END +
        -- Frequency bonus (clients who come regularly)
        CASE 
          WHEN c.average_interval_days IS NOT NULL AND c.last_appointment_date IS NOT NULL THEN
            CASE WHEN (NOW() - c.last_appointment_date) >= (c.average_interval_days || ' days')::INTERVAL 
                 THEN 0.05 ELSE 0.0 END
          ELSE 0.0 
        END
      )::DECIMAL(3,2) as confidence_score,
      
      -- Generate suggestion reason
      CONCAT(
        CASE WHEN c.preferred_professional_id = p_professional_id THEN 'Profissional preferido. ' ELSE '' END,
        CASE WHEN c.average_interval_days IS NOT NULL AND c.last_appointment_date IS NOT NULL THEN
          CASE WHEN (NOW() - c.last_appointment_date) >= (c.average_interval_days || ' days')::INTERVAL 
               THEN 'Devido para próximo agendamento. ' ELSE '' END
        ELSE '' END,
        CASE WHEN EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.client_phone = c.phone 
            AND EXTRACT(hour FROM a.start_time) BETWEEN slot_hour - 1 AND slot_hour + 1
            AND a.status = 'completed'
        ) THEN 'Horário preferido. ' ELSE '' END
      ) as suggestion_reason
      
    FROM clients c
    WHERE c.company_id = company_id_val
      AND c.status = 'active'
      AND c.deleted_at IS NULL
      -- Exclude clients who already have appointments in this time slot
      AND NOT EXISTS (
        SELECT 1 FROM appointments a 
        WHERE a.client_phone = c.phone 
          AND a.start_time BETWEEN p_start_time AND p_end_time
          AND a.status IN ('scheduled', 'confirmed')
          AND a.deleted_at IS NULL
      )
      -- Exclude clients who already have a pending suggestion for this time
      AND NOT EXISTS (
        SELECT 1 FROM client_suggestions cs
        WHERE cs.client_id = c.id
          AND cs.suggested_time BETWEEN p_start_time AND p_end_time
          AND cs.status = 'pending'
      )
  )
  SELECT 
    cs.client_id,
    cs.client_name,
    cs.client_phone,
    cs.confidence_score,
    COALESCE(NULLIF(cs.suggestion_reason, ''), 'Cliente ativo disponível') as suggestion_reason
  FROM client_scores cs
  WHERE cs.confidence_score > 0.2
  ORDER BY cs.confidence_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to create a client suggestion
CREATE OR REPLACE FUNCTION create_client_suggestion(
  p_client_id UUID,
  p_professional_id UUID,
  p_service_id UUID,
  p_suggested_time TIMESTAMP WITH TIME ZONE,
  p_suggestion_reason TEXT,
  p_confidence_score DECIMAL(3,2)
) RETURNS UUID AS $$
DECLARE
  suggestion_id UUID;
  company_id_val UUID;
BEGIN
  -- Get company ID
  SELECT company_id INTO company_id_val FROM clients WHERE id = p_client_id;
  
  -- Create the suggestion
  INSERT INTO client_suggestions (
    company_id,
    client_id,
    professional_id,
    service_id,
    suggested_time,
    suggestion_reason,
    confidence_score
  ) VALUES (
    company_id_val,
    p_client_id,
    p_professional_id,
    p_service_id,
    p_suggested_time,
    p_suggestion_reason,
    p_confidence_score
  ) RETURNING id INTO suggestion_id;
  
  RETURN suggestion_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update client stats when appointments change
CREATE OR REPLACE FUNCTION trigger_update_client_stats() RETURNS TRIGGER AS $$
DECLARE
  client_id_val UUID;
BEGIN
  -- Find client by phone
  SELECT id INTO client_id_val 
  FROM clients 
  WHERE phone = COALESCE(NEW.client_phone, OLD.client_phone)
    AND company_id = COALESCE(NEW.company_id, OLD.company_id);
  
  IF client_id_val IS NOT NULL THEN
    PERFORM update_client_stats(client_id_val);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_client_stats_trigger ON appointments;
CREATE TRIGGER update_client_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_client_stats();
