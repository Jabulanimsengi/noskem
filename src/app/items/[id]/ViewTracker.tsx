'use client';

import { useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';

export default function ViewTracker({ itemId }: { itemId: number }) {
  useEffect(() => {
    const supabase = createClient();
    
    const trackView = async () => {
      // Call the RPC function to increment the view count for this item
      await supabase.rpc('increment_view_count', {
        item_id_to_increment: itemId,
      });
    };

    // Track the view once per page load
    trackView();
  }, [itemId]); // This ensures the effect runs only once

  // This component doesn't render any visible UI
  return null;
}