// src/app/search/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// The action now returns a structured response
type ActionResponse = {
  success: boolean;
  message: string;
};

export async function saveSearchAction(query: string): Promise<ActionResponse> {
  if (!query) {
    return { success: false, message: 'Search query cannot be empty.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be logged in to save a search.' };
  }

  // Check if this search already exists for the user to avoid duplicates
  const { data: existingSearch, error: existingError } = await supabase
    .from('saved_searches')
    .select('id')
    .eq('user_id', user.id)
    .eq('search_query', query)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking for existing search:', existingError);
    return { success: false, message: 'Failed to save search.' };
  }

  if (existingSearch) {
    return { success: false, message: 'You have already saved this search.' };
  }

  // If it doesn't exist, insert the new saved search
  const { error } = await supabase
    .from('saved_searches')
    .insert({ user_id: user.id, search_query: query });

  if (error) {
    console.error('Error saving search:', error);
    return { success: false, message: 'Failed to save search.' };
  }

  // Revalidate the dashboard page so the new search appears in the list
  revalidatePath('/account/dashboard/saved-searches');

  return { success: true, message: 'Search saved successfully!' };
}