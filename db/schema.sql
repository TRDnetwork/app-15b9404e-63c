-- TaskFlow Pro - app_e590 schema
-- Minimal backend schema for potential future expansion

CREATE TABLE IF NOT EXISTS app_e590_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_e590_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tasks" ON app_e590_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON app_e590_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON app_e590_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON app_e590_tasks;

-- Create RLS policies
CREATE POLICY "Users can view own tasks" ON app_e590_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON app_e590_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON app_e590_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON app_e590_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_e590_tasks_user_id ON app_e590_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_app_e590_tasks_priority ON app_e590_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_app_e590_tasks_is_completed ON app_e590_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_app_e590_tasks_created_at ON app_e590_tasks(created_at);

-- Add to realtime publication for potential live updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_e590_tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_e590_tasks;
    END IF;
END $$;

-- Create storage bucket for potential file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('app_e590_attachments', 'app_e590_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the attachments bucket
DROP POLICY IF EXISTS "Users can upload own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own attachments" ON storage.objects;

CREATE POLICY "Users can upload own attachments" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'app_e590_attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own attachments" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'app_e590_attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own attachments" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'app_e590_attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read own attachments" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'app_e590_attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );