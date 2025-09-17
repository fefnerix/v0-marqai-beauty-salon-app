-- VALIDAÇÕES e TRIGGERS para regras de negócio da agenda

-- Função para validar conflitos de horário
CREATE OR REPLACE FUNCTION validate_appointment_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  settings_rec RECORD;
  conflict_count INT;
BEGIN
  -- Pular validação se for soft delete
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Pular validação se não tiver horário definido (encaixe)
  IF NEW.start_at IS NULL OR NEW.end_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar configurações da empresa
  SELECT * INTO settings_rec 
  FROM agenda_settings 
  WHERE company_id = NEW.company_id;

  -- Se não existir configuração, criar padrão
  IF NOT FOUND THEN
    INSERT INTO agenda_settings (company_id) VALUES (NEW.company_id);
    settings_rec.allow_overbooking := false;
  END IF;

  -- Se overbooking permitido e marcado como overbooked, permitir
  IF settings_rec.allow_overbooking AND NEW.overbooked THEN
    RETURN NEW;
  END IF;

  -- Verificar conflito com mesmo profissional
  SELECT COUNT(*) INTO conflict_count
  FROM appointments
  WHERE company_id = NEW.company_id
    AND professional_id = NEW.professional_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND deleted_at IS NULL
    AND start_at IS NOT NULL
    AND end_at IS NOT NULL
    AND (
      (NEW.start_at >= start_at AND NEW.start_at < end_at) OR
      (NEW.end_at > start_at AND NEW.end_at <= end_at) OR
      (NEW.start_at <= start_at AND NEW.end_at >= end_at)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Conflito de horário: profissional já possui atendimento neste período';
  END IF;

  -- Verificar conflito com mesmo cliente
  SELECT COUNT(*) INTO conflict_count
  FROM appointments
  WHERE company_id = NEW.company_id
    AND client_id = NEW.client_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND deleted_at IS NULL
    AND start_at IS NOT NULL
    AND end_at IS NOT NULL
    AND (
      (NEW.start_at >= start_at AND NEW.start_at < end_at) OR
      (NEW.end_at > start_at AND NEW.end_at <= end_at) OR
      (NEW.start_at <= start_at AND NEW.end_at >= end_at)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Conflito de horário: cliente já possui atendimento neste período';
  END IF;

  -- Verificar se está dentro de ausência do profissional
  SELECT COUNT(*) INTO conflict_count
  FROM professional_absences
  WHERE company_id = NEW.company_id
    AND professional_id = NEW.professional_id
    AND (
      (NEW.start_at >= start_at AND NEW.start_at < end_at) OR
      (NEW.end_at > start_at AND NEW.end_at <= end_at) OR
      (NEW.start_at <= start_at AND NEW.end_at >= end_at)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Não é possível agendar: profissional está ausente neste período';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar conflitos
DROP TRIGGER IF EXISTS trigger_validate_appointment_conflicts ON appointments;
CREATE TRIGGER trigger_validate_appointment_conflicts
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_conflicts();

-- Função para atualizar last_write_at automaticamente
CREATE OR REPLACE FUNCTION update_last_write_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_write_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar last_write_at
DROP TRIGGER IF EXISTS trigger_update_last_write_at ON appointments;
CREATE TRIGGER trigger_update_last_write_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_last_write_at();

-- Função para log de alterações
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO appointment_logs (company_id, appointment_id, action, new_payload, actor)
    VALUES (NEW.company_id, NEW.id, 'created', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO appointment_logs (company_id, appointment_id, action, old_payload, new_payload, actor)
    VALUES (NEW.company_id, NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO appointment_logs (company_id, appointment_id, action, old_payload, actor)
    VALUES (OLD.company_id, OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para log de alterações
DROP TRIGGER IF EXISTS trigger_log_appointment_changes ON appointments;
CREATE TRIGGER trigger_log_appointment_changes
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_appointment_changes();
