import { createClient } from '@/app/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditItemForm from '../../EditItemForm';
import { type Item, type Category } from '@/types';

interface EditItemPageProps {
  params: { id: string };
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const supabase = await createClient();
  const itemId = params.id;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }

  // Fetch the item and all categories simultaneously
  const [itemRes, categoriesRes] = await Promise.all([
    supabase.from('items').select('*').eq('id', itemId).single(),
    supabase.from('categories').select('*').order('name', { ascending: true })
  ]);
  
  const item = itemRes.data as Item;
  const categories = categoriesRes.data as Category[];

  // Validation: Ensure item exists and the user owns it
  if (itemRes.error || !item) {
    notFound();
  }
  if (item.seller_id !== user.id) {
    return <div className="p-8 text-center text-red-500">You are not authorized to edit this item.</div>;
  }

  return <EditItemForm item={item} categories={categories} />;
}
