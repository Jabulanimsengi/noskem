// src/app/items/new/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import NewItemForm from './NewItemForm';
import { type Category } from '@/types'; // Import our new type

export default async function NewItemPageProtected() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/auth");
  }

  // Fetch the list of categories from the database
  const { data: categoriesData, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    // Handle the error appropriately, maybe show a message
  }
  
  const categories: Category[] = categoriesData || [];

  // Pass the fetched categories to the form component
  return <NewItemForm categories={categories} />;
}