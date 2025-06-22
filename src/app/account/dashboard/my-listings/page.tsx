import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import MyListingsClient from './MyListingsClient';
import { type Item } from '@/types';

export default async function MyListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/?authModal=true&redirect=/account/dashboard/my-listings');
  }

  // Fetch all items belonging to the current user
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500 text-center p-4">Error fetching your listings.</p>;
  }

  return <MyListingsClient items={items as Item[]} />;
}