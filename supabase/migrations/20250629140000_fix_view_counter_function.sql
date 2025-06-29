-- Drop the duplicate, unsafe version of the function that takes a BIGINT
DROP FUNCTION IF EXISTS public.increment_view_count(bigint);

-- Re-create the correct and safe version of the function to ensure it's the only one
-- This version correctly handles NULL values by treating them as 0 before incrementing.
CREATE OR REPLACE FUNCTION public.increment_view_count(item_id_to_increment integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.items
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = item_id_to_increment;
$$;