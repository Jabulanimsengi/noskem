CREATE OR REPLACE FUNCTION get_item_details_and_similar_items(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  item_details JSONB;
  similar_items_list JSONB;
  category_id_param INT;
BEGIN
  -- Get the category_id of the main item
  SELECT category_id INTO category_id_param FROM items WHERE id = item_id_param;

  -- Fetch the main item's details
  SELECT to_jsonb(items.*) INTO item_details FROM items WHERE id = item_id_param;

  -- Fetch similar items
  SELECT jsonb_agg(to_jsonb(i.*))
  INTO similar_items_list
  FROM items i
  WHERE i.category_id = category_id_param AND i.id != item_id_param AND i.status = 'available'
  LIMIT 10;

  -- Combine the results into a single JSON object
  RETURN jsonb_build_object(
    'item', item_details,
    'similar_items', similar_items_list
  );
END;
$$;