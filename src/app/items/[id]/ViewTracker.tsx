'use client';

import { useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';

export default function ViewTracker({ itemId }: { itemId: number }) {
  useEffect(() => {
    const supabase = createClient();
    
    const trackView = async () => {
      // --- FIX: The argument name has been corrected ---
      // It now correctly passes 'item_id_to_increment' as expected by the database function.
      await supabase.rpc('increment_view_count', {
        item_id_to_increment: itemId,
      });
      // --- END OF FIX ---
    };

    // Track the view once per page load
    trackView();
  }, [itemId]); // This ensures the effect runs only once

  // This component doesn't render any visible UI
  return null;
}