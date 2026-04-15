-- ============================================
-- Create Initial Admin User
-- Studio Booker - UIC Music
-- ============================================

-- Create initial admin user with your email
-- Email: alex.kosasih@usg.education
-- Password: Admin123456! (please change after first login!)

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'alex.kosasih@usg.education';
  
  -- If not exists, create new user
  IF NOT FOUND THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_sent_at,
      last_sign_in_at
    )
    VALUES (
      gen_random_uuid(),
      'alex.kosasih@usg.education',
      crypt('Admin123456!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Alexander Kosasih","role":"ADMIN"}',
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Admin user created successfully: alex.kosasih@usg.education';
  ELSE
    RAISE NOTICE 'Admin user already exists: %', admin_user_id;
  END IF;
END $$;

-- ============================================
-- IMPORTANT: Change password after first login!
-- ============================================
