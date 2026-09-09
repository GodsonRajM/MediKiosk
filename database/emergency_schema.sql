-- ==============================================================================
-- MediKiosk Emergency Access & SOS Schema Extension
-- ==============================================================================

CREATE TABLE IF NOT EXISTS emergency_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    blood_group VARCHAR(10),
    emergency_contact VARCHAR(50),
    allergies JSONB DEFAULT '[]'::jsonb,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_profiles_patient ON emergency_profiles(patient_id);

CREATE TABLE IF NOT EXISTS emergency_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_tokens_tok ON emergency_access_tokens(token);

CREATE TABLE IF NOT EXISTS emergency_sos_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL,
    ip_address VARCHAR(50),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    note TEXT,
    status VARCHAR(30) DEFAULT 'triggered' CHECK (status IN ('triggered', 'acknowledged', 'dispatched', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_sos_created ON emergency_sos_events(created_at DESC);
