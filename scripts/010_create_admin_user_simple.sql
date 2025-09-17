-- Script simplificado para criar usuário admin
-- Este script cria o usuário admin usando a função auth.users do Supabase

-- Primeiro, vamos garantir que existe pelo menos uma empresa
INSERT INTO empresas (id, nome, email, telefone, endereco, ativa, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Marqai Salon',
  'contato@marqai.com',
  '(11) 99999-9999',
  'Rua Principal, 123',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Agora vamos criar o usuário admin usando a API do Supabase
-- Nota: Este usuário precisa ser criado através da interface do Supabase ou via API
-- Por enquanto, vamos apenas preparar o perfil para quando o usuário for criado

-- Criar perfil admin (será associado quando o usuário fizer login)
DO $$
DECLARE
    empresa_id_var uuid;
BEGIN
    -- Pegar o ID da primeira empresa
    SELECT id INTO empresa_id_var FROM empresas WHERE ativa = true LIMIT 1;
    
    -- Se não houver empresa, criar uma
    IF empresa_id_var IS NULL THEN
        INSERT INTO empresas (id, nome, email, telefone, endereco, ativa, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Marqai Salon',
            'contato@marqai.com',
            '(11) 99999-9999',
            'Rua Principal, 123',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO empresa_id_var;
    END IF;
    
    -- Criar função para inserir perfil quando usuário admin fizer login
    CREATE OR REPLACE FUNCTION public.handle_admin_login()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY definer
    SET search_path = public
    AS $function$
    DECLARE
        empresa_id_var uuid;
    BEGIN
        -- Só processar se for o email admin
        IF NEW.email = 'admin@marqai.com' THEN
            -- Pegar ID da primeira empresa ativa
            SELECT id INTO empresa_id_var FROM empresas WHERE ativa = true LIMIT 1;
            
            -- Inserir perfil admin se não existir
            INSERT INTO perfis (
                id,
                empresa_id,
                nome,
                email,
                papel,
                ativo,
                permite_overbooking,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                empresa_id_var,
                'Administrador',
                'admin@marqai.com',
                'admin',
                true,
                true,
                NOW(),
                NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            -- Inserir na tabela company_members se existir
            INSERT INTO company_members (
                id,
                user_id,
                company_id,
                role,
                active,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                NEW.id,
                empresa_id_var,
                'admin',
                true,
                NOW(),
                NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;
        
        RETURN NEW;
    END;
    $function$;
    
    -- Criar trigger para executar a função quando usuário fizer login
    DROP TRIGGER IF EXISTS on_admin_login ON auth.users;
    CREATE TRIGGER on_admin_login
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_admin_login();
        
END $$;
