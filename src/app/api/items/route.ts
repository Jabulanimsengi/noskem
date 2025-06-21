'use server';

import { createClient } from '@/app/utils/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient(); 
  
  const searchParams = request.nextUrl.searchParams;
  const categorySlug = searchParams.get('category');

  try {
    let query = supabase
      .from('items')
      .select('*, profiles(username, avatar_url)')
      .eq('status', 'available');

    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);

  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ message: 'Failed to fetch items.' }),
      { status: 500 }
    );
  }
}