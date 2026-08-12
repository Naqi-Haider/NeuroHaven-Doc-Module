-- Supabase Schema for NeuroHaven Doctor Dashboard

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    specialization TEXT,
    institution TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    date_of_birth DATE,
    emergency_contact TEXT,
    cognitive_level INTEGER DEFAULT 0 NOT NULL, -- 0-100 scale
    caregiver_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Patient-Doctor Links Table
CREATE TABLE IF NOT EXISTS patient_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL CHECK (status IN ('active', 'inactive', 'pending')),
    CONSTRAINT unique_doctor_patient_link UNIQUE (doctor_id, patient_id)
);

-- 5. Cognitive Profiles Table (Derived clinical parameters)
CREATE TABLE IF NOT EXISTS cognitive_profiles (
    patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
    baseline_score INTEGER DEFAULT 0 NOT NULL,
    current_score INTEGER DEFAULT 0 NOT NULL,
    improvement_percent NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    decline_percent NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('memory_match', 'word_recall', 'pattern_recognition')),
    difficulty INTEGER DEFAULT 1 NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
    score INTEGER DEFAULT 0 NOT NULL,
    duration_seconds INTEGER DEFAULT 0 NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    synced BOOLEAN DEFAULT TRUE NOT NULL
);

-- 7. Daily Notes Table (Contains AI-extracted entities)
CREATE TABLE IF NOT EXISTS daily_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    voice_path TEXT,
    extracted_entities JSONB DEFAULT '[]'::jsonb NOT NULL, -- PERSON, DATE, MEDICATION, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    synced BOOLEAN DEFAULT TRUE NOT NULL
);

-- 8. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    category TEXT NOT NULL CHECK (category IN ('medical', 'cognitive', 'emotional', 'system')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_url TEXT
);

-- 9. Cognitive Reports Table
CREATE TABLE IF NOT EXISTS cognitive_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT NOT NULL,
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    metrics_average_score INTEGER NOT NULL,
    metrics_total_sessions INTEGER NOT NULL,
    metrics_average_difficulty INTEGER NOT NULL,
    metrics_reminder_adherence NUMERIC(5,2) NOT NULL,
    metrics_ai_interaction_count INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_patient_links_doctor ON patient_links(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_links_patient ON patient_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_notes_user ON daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- 11. Chat Messages Table (Real-time clinical conversations)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text'::text NOT NULL,
    duration INTEGER,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_patient ON chat_messages(patient_id);
