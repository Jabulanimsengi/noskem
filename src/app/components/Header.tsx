import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';

export default async function Header() {
  // We now MUST await the createClient() function
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="w-full border-b border-gray-700 bg-gray-800">
      <div className="container flex items-center justify-between p-4 mx-auto">
        <Link href="/" className="text-xl font-bold text-white">
          Marketplace
        </Link>
        <AuthButton user={user} />
      </div>
    </nav>
  );
}