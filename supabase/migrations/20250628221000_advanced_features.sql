-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";

-- Create a new ENUM type for the different kinds of badges
CREATE TYPE public.badge_type AS ENUM (
    'first_sale',
    'top_seller',
    'power_buyer',
    'quick_shipper'
);

-- Create the user_badges table to track which users have earned which badges
CREATE TABLE public.user_badges (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_type public.badge_type NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_type)
);

-- Create the function to find items near a given location
-- This function uses PostGIS to calculate distances efficiently
CREATE OR REPLACE FUNCTION public.get_items_nearby(lat float, long float, radius_km float)
RETURNS SETOF public.items AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.items
    WHERE
        status = 'available' AND
        ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(long, lat)::geography,
            radius_km * 1000
        );
END;
$$ LANGUAGE plpgsql;

-- Create a function to award badges based on achievements
CREATE OR REPLACE FUNCTION public.award_badge_if_not_exists(p_user_id UUID, p_badge_type public.badge_type)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_badges (user_id, badge_type)
    VALUES (p_user_id, p_badge_type)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;