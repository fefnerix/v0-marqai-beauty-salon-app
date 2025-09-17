-- AGENDA & ATENDIMENTOS - Database Schema
-- Todas as tabelas com company_id e RLS por empresa

-- PROFISSIONAIS (se já existir, manter e só garantir campos usados pela agenda)
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT '#3B82F6', -- cor da coluna (UI)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CLIENTES (mínimo para agenda)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SERVIÇOS
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL, -- p/ somar encadeados
  buffer_after_minutes INT NOT NULL DEFAULT 0, -- buffer configurável
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TIPOS ENUM
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled','in_progress','done','no_show','canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wait_priority AS ENUM ('normal','vip','urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE absence_type AS ENUM ('vacation','time_off','leave');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE repeat_kind AS ENUM ('weekly','biweekly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ATENDIMENTOS (compõem a agenda)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  client_id UUID REFERENCES clients(id),
  start_at TIMESTAMPTZ, -- pode ser null quando sem horário (encaixe)
  end_at TIMESTAMPTZ,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  overbooked BOOLEAN NOT NULL DEFAULT false,
  repeat_rule_id UUID, -- se vier de repetição
  last_write_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- p/ resolução de conflito
  deleted_at TIMESTAMPTZ, -- lixeira/undo
  created_by UUID, -- user id
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SERVIÇOS encadeados do atendimento
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  order_index INT NOT NULL DEFAULT 0
);

-- FILA DE ESPERA
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  professional_id UUID REFERENCES professionals(id), -- opcional
  desired_date DATE,
  priority wait_priority NOT NULL DEFAULT 'normal',
  position INT NOT NULL, -- ordenação manual
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AUSÊNCIAS do profissional
CREATE TABLE IF NOT EXISTS professional_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  kind absence_type NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONFIG DA AGENDA por empresa (buffers, overbooking, regra de cancelamento tardio)
CREATE TABLE IF NOT EXISTS agenda_settings (
  company_id UUID PRIMARY KEY,
  allow_overbooking BOOLEAN NOT NULL DEFAULT false,
  late_cancel_limit_minutes INT NOT NULL DEFAULT 120, -- p/ decidir falta vs reagendar
  suggest_next_visit_days INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REPETIÇÃO (semanal/quinzenal)
CREATE TABLE IF NOT EXISTS repeat_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  kind repeat_kind NOT NULL,
  weekday INT NOT NULL, -- 0-6 (dom-sáb)
  occurrences INT, -- opcional: limitar número
  until_date DATE, -- ou fim aberto
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LOG de alterações (p/ conflitos + auditoria básica da agenda)
CREATE TABLE IF NOT EXISTS appointment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  action TEXT NOT NULL, -- created/updated/moved/status_changed/deleted/restored/conflict_resolved
  old_payload JSONB,
  new_payload JSONB,
  actor UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_professionals_company_active ON professionals(company_id, active);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_professional_date ON appointments(company_id, professional_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_company_client_date ON appointments(company_id, client_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_deleted ON appointments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_company_position ON waitlist(company_id, position);
CREATE INDEX IF NOT EXISTS idx_professional_absences_company_professional ON professional_absences(company_id, professional_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_company_appointment ON appointment_logs(company_id, appointment_id);
