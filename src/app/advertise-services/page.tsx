import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdvertiseForm from './AdvertiseForm';
import Link from 'next/link';

export default async function AdvertisePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/?authModal=true');
  }

  // Updated: Added error handling for the categories query
  const { data: categories, error: categoriesError } = await supabase
    .from('service_categories')
    .select('id, name')
    .order('name');
    
  // If there's an error, log it to the server console and show a message
  if (categoriesError) {
    console.error("Error fetching service categories:", categoriesError.message);
    return (
        <div className="text-center py-10 text-red-500">
            <h1 className="text-2xl font-bold">Could not load categories</h1>
            <p>There was an issue fetching service categories from the database. Please try again later.</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Advertise Your Services</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Fill out the form below to get your services listed. Your submission will be reviewed by an admin before it goes live.
        </p>
      </div>

      <AdvertiseForm userEmail={user.email!} categories={categories || []} />
    </div>
  );
}