// File: app/items/new/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import NewItemForm from './NewItemForm'; // The form component we already created

export default async function NewItemPageProtected() {
  const supabase = await createClient();

  // We still need to check if the user is logged in to protect the route
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user, redirect them to the login page
    return redirect("/auth");
  }

  // --- THIS IS THE FIX ---
  // We simply render the NewItemForm component without passing any props,
  // because the form now handles everything itself via the server action.
  return <NewItemForm />;
}