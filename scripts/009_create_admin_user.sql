-- Criar usuário admin no sistema de autenticação
-- Este script deve ser executado no Supabase para criar o usuário admin

-- Inserir usuário admin diretamente na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@marqai.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin", "role": "admin"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Criar perfil admin na tabela perfis se não existir
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
) 
SELECT 
  u.id,
  (SELECT id FROM empresas LIMIT 1), -- Pega a primeira empresa disponível
  'Administrador',
  'admin@marqai.com',
  'admin',
  true,
  true,
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email = 'admin@marqai.com'
ON CONFLICT (id) DO NOTHING;
