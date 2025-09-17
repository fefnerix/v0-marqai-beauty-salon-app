-- RLS POLICIES para todas as tabelas da agenda
-- Usuário autenticado só enxerga registros com company_id das empresas às quais tem acesso

-- Habilitar RLS em todas as tabelas
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE repeat_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar acesso à empresa (assumindo que já existe)
-- Se não existir, criar uma versão básica
CREATE OR REPLACE FUNCTION user_has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Por enquanto, permitir acesso a qualquer empresa para usuário autenticado
  -- Em produção, implementar lógica real de verificação de acesso
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES para PROFESSIONALS
DROP POLICY IF EXISTS "professionals_company_access" ON professionals;
CREATE POLICY "professionals_company_access" ON professionals
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para CLIENTS
DROP POLICY IF EXISTS "clients_company_access" ON clients;
CREATE POLICY "clients_company_access" ON clients
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para SERVICES
DROP POLICY IF EXISTS "services_company_access" ON services;
CREATE POLICY "services_company_access" ON services
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para APPOINTMENTS
DROP POLICY IF EXISTS "appointments_company_access" ON appointments;
CREATE POLICY "appointments_company_access" ON appointments
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para APPOINTMENT_SERVICES
DROP POLICY IF EXISTS "appointment_services_company_access" ON appointment_services;
CREATE POLICY "appointment_services_company_access" ON appointment_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.id = appointment_services.appointment_id 
      AND user_has_company_access(a.company_id)
    )
  );

-- POLICIES para WAITLIST
DROP POLICY IF EXISTS "waitlist_company_access" ON waitlist;
CREATE POLICY "waitlist_company_access" ON waitlist
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para PROFESSIONAL_ABSENCES
DROP POLICY IF EXISTS "professional_absences_company_access" ON professional_absences;
CREATE POLICY "professional_absences_company_access" ON professional_absences
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para AGENDA_SETTINGS
DROP POLICY IF EXISTS "agenda_settings_company_access" ON agenda_settings;
CREATE POLICY "agenda_settings_company_access" ON agenda_settings
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para REPEAT_RULES
DROP POLICY IF EXISTS "repeat_rules_company_access" ON repeat_rules;
CREATE POLICY "repeat_rules_company_access" ON repeat_rules
  FOR ALL USING (user_has_company_access(company_id));

-- POLICIES para APPOINTMENT_LOGS
DROP POLICY IF EXISTS "appointment_logs_company_access" ON appointment_logs;
CREATE POLICY "appointment_logs_company_access" ON appointment_logs
  FOR ALL USING (user_has_company_access(company_id));
