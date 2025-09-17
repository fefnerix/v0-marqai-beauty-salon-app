-- IMPLEMENTAÇÃO ADEQUADA DE RLS COM COMPANY_MEMBERS
-- Este script cria a estrutura necessária para RLS baseado em membros de empresa

-- Criar tabela company_members se não existir
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Habilitar RLS na tabela company_members
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Policy para company_members - usuários só veem suas próprias memberships
DROP POLICY IF EXISTS "company_members_own_access" ON company_members;
CREATE POLICY "company_members_own_access" ON company_members
  FOR ALL USING (auth.uid() = user_id);

-- Função melhorada para verificar acesso à empresa
CREATE OR REPLACE FUNCTION user_has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário autenticado tem acesso à empresa
  RETURN EXISTS (
    SELECT 1 
    FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id = target_company_id
    AND cm.active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter company_id do usuário atual (primeira empresa ativa)
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
  company_id UUID;
BEGIN
  SELECT cm.company_id INTO company_id
  FROM company_members cm
  WHERE cm.user_id = auth.uid()
  AND cm.active = true
  ORDER BY cm.created_at ASC
  LIMIT 1;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar todas as policies existentes para usar a função melhorada
-- PROFESSIONALS
DROP POLICY IF EXISTS "professionals_company_access" ON professionals;
CREATE POLICY "professionals_company_access" ON professionals
  FOR ALL USING (user_has_company_access(company_id));

-- CLIENTS  
DROP POLICY IF EXISTS "clients_company_access" ON clients;
CREATE POLICY "clients_company_access" ON clients
  FOR ALL USING (user_has_company_access(company_id));

-- SERVICES
DROP POLICY IF EXISTS "services_company_access" ON services;
CREATE POLICY "services_company_access" ON services
  FOR ALL USING (user_has_company_access(company_id));

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_company_access" ON appointments;
CREATE POLICY "appointments_company_access" ON appointments
  FOR ALL USING (user_has_company_access(company_id));

-- APPOINTMENT_SERVICES (através do appointment)
DROP POLICY IF EXISTS "appointment_services_company_access" ON appointment_services;
CREATE POLICY "appointment_services_company_access" ON appointment_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.id = appointment_services.appointment_id 
      AND user_has_company_access(a.company_id)
    )
  );

-- WAITLIST
DROP POLICY IF EXISTS "waitlist_company_access" ON waitlist;
CREATE POLICY "waitlist_company_access" ON waitlist
  FOR ALL USING (user_has_company_access(company_id));

-- PROFESSIONAL_ABSENCES
DROP POLICY IF EXISTS "professional_absences_company_access" ON professional_absences;
CREATE POLICY "professional_absences_company_access" ON professional_absences
  FOR ALL USING (user_has_company_access(company_id));

-- AGENDA_SETTINGS
DROP POLICY IF EXISTS "agenda_settings_company_access" ON agenda_settings;
CREATE POLICY "agenda_settings_company_access" ON agenda_settings
  FOR ALL USING (user_has_company_access(company_id));

-- REPEAT_RULES
DROP POLICY IF EXISTS "repeat_rules_company_access" ON repeat_rules;
CREATE POLICY "repeat_rules_company_access" ON repeat_rules
  FOR ALL USING (user_has_company_access(company_id));

-- APPOINTMENT_LOGS
DROP POLICY IF EXISTS "appointment_logs_company_access" ON appointment_logs;
CREATE POLICY "appointment_logs_company_access" ON appointment_logs
  FOR ALL USING (user_has_company_access(company_id));

-- Criar tabela professional_schedules se não existir (necessária para horários individuais)
CREATE TABLE IF NOT EXISTS professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, professional_id, day_of_week)
);

-- Habilitar RLS na tabela professional_schedules
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;

-- Policy para professional_schedules
DROP POLICY IF EXISTS "professional_schedules_company_access" ON professional_schedules;
CREATE POLICY "professional_schedules_company_access" ON professional_schedules
  FOR ALL USING (user_has_company_access(company_id));

-- Inserir dados de exemplo para company_members (apenas se não existirem)
-- Assumindo que existe um usuário e uma empresa para teste
DO $$
DECLARE
  test_user_id UUID;
  test_company_id UUID;
BEGIN
  -- Buscar primeiro usuário e primeira empresa para criar membership de exemplo
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_company_id FROM companies LIMIT 1;
  
  -- Inserir membership apenas se ambos existirem e não houver membership ainda
  IF test_user_id IS NOT NULL AND test_company_id IS NOT NULL THEN
    INSERT INTO company_members (user_id, company_id, role, active)
    VALUES (test_user_id, test_company_id, 'owner', true)
    ON CONFLICT (user_id, company_id) DO NOTHING;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_company ON company_members(user_id, company_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional ON professional_schedules(professional_id, day_of_week);
