-- Fix for "profiles.verification_status does not exist" error
-- Adds columns to the profiles table to handle ID verification status and document storage.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_verified',
ADD COLUMN IF NOT EXISTS verification_documents JSONB;

-- Fix for "Could not load saved searches" error
-- Creates the saved_searches table for the "Saved Searches" feature.
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, search_query)
);

-- Enable Row Level Security for the saved_searches table
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Add policies so users can only manage their own saved searches
CREATE POLICY "Users can manage their own saved searches"
ON public.saved_searches
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a new ENUM type for the different kinds of badges, only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_type') THEN
        CREATE TYPE public.badge_type AS ENUM (
            'verified_id',
            'first_sale',
            'top_seller',
            'power_buyer',
            'quick_shipper'
        );
    END IF;
END
$$;

-- Create the user_badges table to track which users have earned which badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_type public.badge_type NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_type)
);

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to view earned badges
CREATE POLICY "Public can view user badges"
ON public.user_badges
FOR SELECT
TO public
USING (true);

-- Create a function to award badges idempotently
CREATE OR REPLACE FUNCTION public.award_badge_if_not_exists(p_user_id UUID, p_badge_type public.badge_type)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_badges (user_id, badge_type)
    VALUES (p_user_id, p_badge_type)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;