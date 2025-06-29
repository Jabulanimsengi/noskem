-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";

-- Create a new ENUM type for the different kinds of badges, only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_type') THEN
        CREATE TYPE public.badge_type AS ENUM (
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

-- Create a new 'likes' table
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id)
);

-- Add new columns to the 'items' table if they don't exist
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS new_item_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_bumped_at TIMESTAMPTZ;


-- Add availability notes to the 'profiles' table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS availability_notes TEXT;

-- Create functions and triggers (these are safe to run again using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.items
        SET likes_count = likes_count + 1
        WHERE id = NEW.item_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.items
        SET likes_count = likes_count - 1
        WHERE id = OLD.item_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

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

CREATE OR REPLACE FUNCTION public.award_badge_if_not_exists(p_user_id UUID, p_badge_type public.badge_type)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_badges (user_id, badge_type)
    VALUES (p_user_id, p_badge_type)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.increment_view_count(bigint);

CREATE OR REPLACE FUNCTION public.increment_view_count(item_id_to_increment integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.items
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = item_id_to_increment;
$$;