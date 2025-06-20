import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import NewItemForm from './NewItemForm';
import { type Category } from '@/types';

export default async function NewItemPageProtected() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Redirect to homepage and add a parameter to trigger the auth modal
    return redirect("/?authModal=true");
  }

  const { data: categoriesData } = await supabase.from('categories').select('*').order('name', { ascending: true });
  
  const categories: Category[] = categoriesData || [];
  
  return <NewItemForm categories={categories} />;
}