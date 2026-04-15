-- Studio Booker Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  role user_role DEFAULT 'STUDENT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Studios table
CREATE TABLE public.studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Equipment table
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  available INTEGER DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT NOT NULL,
  status booking_status DEFAULT 'PENDING',
  approved_by_id UUID REFERENCES public.users(id),
  is_overdue BOOLEAN DEFAULT false,
  auto_returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Booking Equipment junction table
CREATE TABLE public.booking_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  UNIQUE(booking_id, equipment_id)
);

-- Return Proofs table
CREATE TABLE public.return_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  images TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_studio_id ON public.bookings(studio_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX idx_equipment_category ON public.equipment(category);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_proofs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES
-- ============================================

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Studios: Everyone can read, only admins/lecturers can modify
CREATE POLICY "Everyone can view studios" ON public.studios
  FOR SELECT USING (true);

CREATE POLICY "Admins and lecturers can modify studios" ON public.studios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'LECTURER')
    )
  );

-- Equipment: Everyone can read, only admins/lecturers can modify
CREATE POLICY "Everyone can view equipment" ON public.equipment
  FOR SELECT USING (true);

CREATE POLICY "Admins and lecturers can modify equipment" ON public.equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'LECTURER')
    )
  );

-- Bookings: Users can CRUD their own, admins/lecturers can view all and approve
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins and lecturers can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'LECTURER')
    )
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins and lecturers can update bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'LECTURER')
    )
  );

-- Booking Equipment: Read for related users, modify by system
CREATE POLICY "Users can view own booking equipment" ON public.booking_equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings WHERE id = booking_equipment.booking_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and lecturers can view all booking equipment" ON public.booking_equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'LECTURER')
    )
  );

-- Return Proofs: Users can view own, admins can view all
CREATE POLICY "Users can view own return proofs" ON public.return_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = return_proofs.booking_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and lecturers can view all return proofs" ON public.return_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'LECTURER')
    )
  );

CREATE POLICY "Users can create return proofs" ON public.return_proofs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = return_proofs.booking_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user record after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STUDENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert demo studios
INSERT INTO public.studios (name, description, location, capacity) VALUES
  ('Studio A - Recording', 'Professional recording studio equipped with high-end analog and digital gear for music production, mixing, and mastering.', NULL, NULL),
  ('Studio B - Recording', 'Recording studio with digital mixer and modern equipment for band recording and live sessions.', NULL, NULL),
  ('Creative Space - Practice', 'Open creative space for individual practice, small ensemble rehearsals, and creative work.', NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert demo equipment (from UIC Music inventory)
INSERT INTO public.equipment (name, quantity, available, category) VALUES
  -- Cables
  ('5m XLR Cable Microphone Male - Female (Stagg)', 7, 7, 'Cables'),
  ('2m XLR to Mini TRS Cable', 1, 1, 'Cables'),
  ('5m XLR Cable Microphone Male - Female (Proel)', 5, 5, 'Cables'),
  ('3m XLR - TRS Cable', 4, 4, 'Cables'),
  ('0.5m XLR Cable Microphone Male - Female', 2, 2, 'Cables'),
  ('5m XLR Cable Speaker Output Male - Female', 13, 13, 'Cables'),
  ('5m Headphone Out 3.5mm Extension', 1, 1, 'Cables'),
  ('3m Headphone Out 3.5mm Extension', 1, 1, 'Cables'),
  -- Microphones
  ('Shure SM57', 2, 2, 'Microphone'),
  ('AKG P220', 1, 1, 'Microphone'),
  ('Rode M3', 2, 2, 'Microphone'),
  ('Mipro Wireless A', 1, 1, 'Microphone'),
  ('Mipro Wireless B', 1, 1, 'Microphone'),
  ('AKG P4 Dynamic', 4, 4, 'Microphone'),
  ('AKG P2 Dynamic', 1, 1, 'Microphone'),
  ('AKG P17 SC', 2, 2, 'Microphone'),
  ('Talk Back Mic BM 400', 1, 1, 'Microphone'),
  ('Rode NTG (boom)', 1, 1, 'Microphone'),
  ('Audio Technica AT2050', 1, 1, 'Microphone'),
  ('Boya WM6 Lavilier mic wireless', 1, 1, 'Microphone'),
  -- Equipment
  ('Steinberg UR 824 - Audio Interface', 1, 1, 'Audio Interface'),
  ('FURMAN PL8 CE Power Conditioner', 1, 1, 'Power'),
  ('Yamaha HS 8 - Speaker Active', 2, 2, 'Speaker'),
  ('Behringer Powerplay Pro XL HA4700 Headphone Amp', 1, 1, 'Headphone Amp'),
  ('Novation Launchkey 49 Mk2 Midi Controller', 1, 1, 'MIDI Controller'),
  ('SENNHEISER HD 206 Headphone', 4, 4, 'Headphone'),
  ('Mixer Yamaha MG 16XU', 1, 1, 'Mixer'),
  ('MIPRO wireless receiver 2 channels', 1, 1, 'Wireless Receiver'),
  ('Yamaha DBR 15 active Speaker', 2, 2, 'Speaker'),
  ('Zoom H6 Set', 1, 1, 'Recorder'),
  ('Yamaha Mixer TF 1 - Digital', 1, 1, 'Mixer'),
  ('Alesis Microverb', 1, 1, 'Effects'),
  ('SPL Equalizer 230 BBE Stereo', 1, 1, 'Equalizer'),
  ('Furman PL8', 1, 1, 'Power'),
  ('Behringer UMC404', 1, 1, 'Audio Interface'),
  ('Speaker Behringer Ribbon 1 Truth B3021A', 2, 2, 'Speaker'),
  -- Accessories
  ('Stand Mic MK 10 Samson', 6, 6, 'Accessory'),
  ('Pop Filter', 3, 3, 'Accessory'),
  ('Stand Mic Samson BL-3', 2, 2, 'Accessory'),
  ('Pro Tools 12 Subscriptions Ilok', 2, 2, 'Software'),
  ('Behringer ultra G -DI Box', 2, 2, 'DI Box'),
  ('Boom Pole Boya PB25', 1, 1, 'Accessory'),
  ('Solder Kit', 1, 1, 'Tool'),
  ('Behringer ultra DI DI100', 2, 2, 'DI Box'),
  ('Behringer HA400', 1, 1, 'Headphone Amp')
ON CONFLICT (name) DO NOTHING;
