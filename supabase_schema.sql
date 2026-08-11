-- ==========================================
-- Punt Tracker Supabase Database Setup Schema
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    paid_by TEXT NOT NULL,
    split_mode TEXT NOT NULL,
    owers TEXT[] NOT NULL DEFAULT '{}',
    exact_splits JSONB DEFAULT '{}'::jsonb,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_settlement BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'completed'
);

-- Migration statement for existing table installations
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies allowing full read, insert, update, delete for all clients
DROP POLICY IF EXISTS "Allow public read access" ON public.transactions;
CREATE POLICY "Allow public read access" ON public.transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.transactions;
CREATE POLICY "Allow public insert access" ON public.transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.transactions;
CREATE POLICY "Allow public update access" ON public.transactions FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.transactions;
CREATE POLICY "Allow public delete access" ON public.transactions FOR DELETE USING (true);

-- 4. Enable Supabase Realtime for live cross-device sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;
