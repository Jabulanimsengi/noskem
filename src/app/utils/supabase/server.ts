import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// The function MUST be async
export const createClient = async () => {
  // We MUST await the cookies() call to resolve the Promise
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};