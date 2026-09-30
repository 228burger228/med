-- =========================================================================
-- Supabase schema for Ainala (not yet used by the web app — data is local).
-- Values are stable codes; the UI maps them to Russian labels.
-- =========================================================================

-- Shared trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Patient profiles (data minimisation)
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Пациент' CHECK (char_length(display_name) <= 40),
    injury_part TEXT NOT NULL CHECK (injury_part IN ('knee', 'shoulder', 'back', 'arm_fracture', 'ankle')),
    rehab_phase TEXT NOT NULL CHECK (rehab_phase IN ('early', 'mid', 'late')),
    injury_date DATE,
    activity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (activity_level IN ('low', 'moderate', 'active')),
    baseline_pain INT NOT NULL DEFAULT 3 CHECK (baseline_pain BETWEEN 0 AND 10),
    units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_patient_profiles_updated ON public.patient_profiles;
CREATE TRIGGER trg_patient_profiles_updated
    BEFORE UPDATE ON public.patient_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Daily pain log (one row per day)
CREATE TABLE IF NOT EXISTS public.pain_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pain_score INT NOT NULL CHECK (pain_score BETWEEN 0 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, logged_date)
);

-- 3. Symptom diary
CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL CHECK (char_length(notes) <= 500),
    red_flag TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pain_logs_user_date ON public.pain_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON public.diary_entries(user_id, logged_date DESC);

-- 4. Completed exercise sessions
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pain_after INT CHECK (pain_after BETWEEN 0 AND 10),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.exercise_sessions(user_id, session_date DESC);

-- =========================================================================
-- Row Level Security: each patient sees and changes only their own rows.
-- WITH CHECK is explicit so a user can't insert/update rows for someone else.
-- =========================================================================
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON public.patient_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own pain logs" ON public.pain_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own diary" ON public.diary_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own sessions" ON public.exercise_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Note: a community feed was removed from this schema. If added back, derive the
-- author name from patient_profiles server-side (no free-text author field) and
-- moderate with a role that bypasses RLS rather than a client-writable status.
-- For 152-FZ, host the database in a Russian region.
