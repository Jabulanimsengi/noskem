'use server';

import { createClient } from '@/app/utils/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient(); 
  
  const searchParams = request.nextUrl.searchParams;
  
  // Get all filter parameters from the URL
  const categorySlug = searchParams.get('category');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const conditions = searchParams.getAll('condition');
  const sortParam = searchParams.get('sort') || 'created_at.desc';
  const [sortColumn, sortOrder] = sortParam.split('.');

  // FIX: Get the page number for pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20; // We will show 20 items per page.
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    // The .select() now includes the 'count' option to get the total number of matching items.
    let query = supabase
      .from('items')
      .select('*, profiles:seller_id(username, avatar_url)', { count: 'exact' })
      .eq('status', 'available');

    // Apply filters...
    if (categorySlug) {
      const { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }
    if (minPrice) query = query.gte('buy_now_price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('buy_now_price', parseFloat(maxPrice));
    if (conditions.length > 0) query = query.in('condition', conditions);
    
    // Apply sorting...
    if (sortColumn && sortOrder) {
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
    }

    // FIX: Use .range() instead of .limit() to get the correct "page" of data.
    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    // FIX: The API now returns the items AND information about whether there are more pages.
    return NextResponse.json({
      items: data,
      hasMore: (count ?? 0) > to + 1,
    });

  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ message: 'Failed to fetch items.' }),
      { status: 500 }
    );
  }
}