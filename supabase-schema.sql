-- =========================================================================
-- Supabase Schema for Ainala Rehab MVP (MedTech Security & RLS Standard)
-- =========================================================================

-- 1. Профили пациентов (минимизация персональных данных — Privacy by Design)
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Пациент',
    injury_part TEXT NOT NULL CHECK (injury_part IN ('Колено', 'Плечо', 'Спина', 'Перелом руки', 'Голеностоп')),
    rehab_phase TEXT NOT NULL CHECK (rehab_phase IN ('Ранняя', 'Средняя', 'Поздняя')),
    activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('low', 'moderate', 'active')),
    baseline_pain INT DEFAULT 3 CHECK (baseline_pain BETWEEN 0 AND 10),
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Дневник боли, симптомов, сна и питания
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pain_score INT NOT NULL CHECK (pain_score BETWEEN 0 AND 10),
    mobility_score INT CHECK (mobility_score BETWEEN 0 AND 10),
    sleep_hours NUMERIC(3,1) CHECK (sleep_hours BETWEEN 0 AND 24),
    swelling_level TEXT DEFAULT 'Минимальный',
    notes TEXT,
    red_flag_triggered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON public.symptom_logs(user_id, logged_date DESC);

-- 3. Выполненные сессии упражнений
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    completed_sets INT NOT NULL,
    rpe_pain_after INT CHECK (rpe_pain_after BETWEEN 0 AND 10),
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Модерируемые посты сообщества
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_display TEXT NOT NULL,
    injury_tag TEXT NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 600),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- Row Level Security (RLS) — строгая изоляция медицинских данных (HIPAA / 152-ФЗ)
-- =========================================================================
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пациент управляет только своим профилем"
    ON public.patient_profiles FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Пациент видит и создаёт только свои записи симптомов"
    ON public.symptom_logs FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Пациент управляет только своими тренировками"
    ON public.exercise_sessions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Все видят только одобренные посты сообщества или свои собственные"
    ON public.community_posts FOR SELECT
    USING (status = 'approved' OR auth.uid() = author_id);

CREATE POLICY "Авторизованный пациент может отправлять пост на модерацию"
    ON public.community_posts FOR INSERT
    WITH CHECK (auth.uid() = author_id AND status = 'pending');
