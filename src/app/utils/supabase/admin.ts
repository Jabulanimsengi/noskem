// File: app/utils/supabase/admin.ts

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// This special client uses the Service Role Key for admin operations.
// It should ONLY be used in secure, server-side environments.
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use the new secret key
    {
      auth: {
        // This configuration is necessary for the admin client
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};