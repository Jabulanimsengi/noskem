'use client';

import { useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';

export default function ViewTracker({ itemId }: { itemId: number }) {
  useEffect(() => {
    // Ensure this effect only runs once when the component mounts with a valid itemId
    if (!itemId) {
      return;
    }

    const supabase = createClient();
    let hasTracked = false; // Use a flag to prevent double-tracking

    const trackView = async () => {
      if (hasTracked) return;
      hasTracked = true;

      try {
        const { error } = await supabase.rpc('increment_view_count', {
          item_id_to_increment: itemId,
        });

        // If there's an error, log it to the browser's console for debugging
        if (error) {
          console.error('Error incrementing view count:', error);
        }
      } catch (e) {
        console.error('An unexpected error occurred while tracking view:', e);
      }
    };

    trackView();

  }, [itemId]); // Dependency array ensures this runs once per item

  // This component doesn't render any visible UI
  return null;
}
