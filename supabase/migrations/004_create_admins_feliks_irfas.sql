-- ============================================
-- Admin users: Feliks & Irfas (UIC Music)
-- Run in Supabase SQL Editor after 002/003 if needed.
-- Password: Admin123456! — change after first login.
-- ============================================

DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'feliks.fernando@usg.education';
  IF NOT FOUND THEN
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role,
      created_at, updated_at, confirmation_sent_at, last_sign_in_at
    )
    VALUES (
      gen_random_uuid(),
      'feliks.fernando@usg.education',
      crypt('Admin123456!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Feliks Fernando","role":"ADMIN"}',
      'authenticated', 'authenticated',
      NOW(), NOW(), NOW(), NOW()
    );
    RAISE NOTICE 'Created admin: feliks.fernando@usg.education';
  ELSE
    RAISE NOTICE 'Already exists: feliks.fernando@usg.education';
  END IF;
END $$;

DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'kang.irfas@usg.education';
  IF NOT FOUND THEN
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role,
      created_at, updated_at, confirmation_sent_at, last_sign_in_at
    )
    VALUES (
      gen_random_uuid(),
      'kang.irfas@usg.education',
      crypt('Admin123456!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Irfas","role":"ADMIN"}',
      'authenticated', 'authenticated',
      NOW(), NOW(), NOW(), NOW()
    );
    RAISE NOTICE 'Created admin: kang.irfas@usg.education';
  ELSE
    RAISE NOTICE 'Already exists: kang.irfas@usg.education';
  END IF;
END $$;
