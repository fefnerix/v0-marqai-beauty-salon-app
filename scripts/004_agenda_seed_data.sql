-- DADOS DE EXEMPLO para demonstração da agenda
-- 1 empresa, 3 profissionais, 6 serviços, 5 clientes

-- Inserir empresa de exemplo (assumindo que já existe estrutura de empresas)
-- Se não existir tabela companies, criar uma básica
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir empresa exemplo se não existir
INSERT INTO companies (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Salão Exemplo')
ON CONFLICT (id) DO NOTHING;

-- Configuração da agenda para empresa exemplo
INSERT INTO agenda_settings (company_id, allow_overbooking, late_cancel_limit_minutes, suggest_next_visit_days)
VALUES ('550e8400-e29b-41d4-a716-446655440000', false, 120, 30)
ON CONFLICT (company_id) DO UPDATE SET
  allow_overbooking = EXCLUDED.allow_overbooking,
  late_cancel_limit_minutes = EXCLUDED.late_cancel_limit_minutes,
  suggest_next_visit_days = EXCLUDED.suggest_next_visit_days;

-- 3 PROFISSIONAIS
INSERT INTO professionals (id, company_id, name, active, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'João Silva', true, '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Maria Santos', true, '#EF4444'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Pedro Costa', true, '#10B981')
ON CONFLICT (id) DO NOTHING;

-- 6 SERVIÇOS
INSERT INTO services (id, company_id, name, duration_minutes, buffer_after_minutes) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Corte Masculino', 30, 5),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Barba', 15, 5),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Corte Feminino', 45, 10),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'Escova', 30, 5),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'Coloração', 90, 15),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440000', 'Manicure', 25, 5)
ON CONFLICT (id) DO NOTHING;

-- 5 CLIENTES
INSERT INTO clients (id, company_id, name, phone) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Ana Oliveira', '(11) 99999-1111'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', 'Carlos Mendes', '(11) 99999-2222'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', 'Beatriz Lima', '(11) 99999-3333'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', 'Roberto Alves', '(11) 99999-4444'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440000', 'Fernanda Rocha', '(11) 99999-5555')
ON CONFLICT (id) DO NOTHING;

-- ALGUNS ATENDIMENTOS DE EXEMPLO para hoje e próximos dias
INSERT INTO appointments (id, company_id, professional_id, client_id, start_at, end_at, status, notes) VALUES
-- Hoje
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 
 CURRENT_DATE + INTERVAL '9 hours', CURRENT_DATE + INTERVAL '9 hours 35 minutes', 'scheduled', 'Corte + Barba'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', 
 CURRENT_DATE + INTERVAL '10 hours', CURRENT_DATE + INTERVAL '10 hours 55 minutes', 'scheduled', 'Corte feminino + escova'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', 
 CURRENT_DATE + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '14 hours 30 minutes', 'scheduled', 'Corte masculino'),
-- Amanhã
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440024', 
 CURRENT_DATE + INTERVAL '1 day 11 hours', CURRENT_DATE + INTERVAL '1 day 11 hours 25 minutes', 'scheduled', 'Manicure'),
-- Atendimento sem horário (encaixe)
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440023', 
 NULL, NULL, 'scheduled', 'Encaixe - corte rápido')
ON CONFLICT (id) DO NOTHING;

-- SERVIÇOS dos atendimentos
INSERT INTO appointment_services (appointment_id, service_id, order_index) VALUES
-- Atendimento 1: Corte + Barba
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440010', 0),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440011', 1),
-- Atendimento 2: Corte feminino + escova
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440012', 0),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440013', 1),
-- Atendimento 3: Corte masculino
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440010', 0),
-- Atendimento 4: Manicure
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440015', 0),
-- Atendimento 5: Encaixe
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440010', 0)
ON CONFLICT DO NOTHING;

-- FILA DE ESPERA de exemplo
INSERT INTO waitlist (id, company_id, client_id, professional_id, desired_date, priority, position, notes) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + 1, 'vip', 1, 'Cliente VIP - preferência'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440023', NULL, CURRENT_DATE + 2, 'normal', 2, 'Qualquer profissional disponível')
ON CONFLICT (id) DO NOTHING;
