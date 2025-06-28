import { createClient } from '@/app/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditItemForm from '../../EditItemForm';
import { type Item, type Category } from '@/types';

// This interface correctly defines the shape of the props for this page.
interface PageProps {
  params: { id: string };
}

// The component's props are typed with PageProps, and `params` is destructured.
// This is the correct pattern and will resolve the TypeScript error.
export default async function EditItemPage({ params }: PageProps) {
  const itemId = params.id;
  
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/?authModal=true');
  }

  const [itemRes, categoriesRes] = await Promise.all([
    supabase.from('items').select('*').eq('id', itemId).single(),
    supabase.from('categories').select('*').order('name', { ascending: true })
  ]);
  
  const item = itemRes.data as Item;
  const categories = categoriesRes.data as Category[];

  if (itemRes.error || !item) {
    notFound();
  }
  if (item.seller_id !== user.id) {
    return <div className="p-8 text-center text-red-500">You are not authorized to edit this item.</div>;
  }

  return <EditItemForm item={item} categories={categories} />;
}