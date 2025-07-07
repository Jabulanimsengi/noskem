// src/app/api/items/route.ts

import { createClient } from '@/utils/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // --- THIS IS THE FIX ---
  // The query now only asks for profile data, avoiding the user_badges table.
  const selectQuery = '*, profiles!seller_id(*)';

  let query = supabase
    .from('items')
    .select(selectQuery, { count: 'exact' })
    .in('status', ['available', 'pending_payment'])
    .range(from, to);

  if (category) {
    query = query.eq('category', category);
  }

  if (sort) {
    const [sortBy, sortOrder] = sort.split('-');
    if (sortBy && sortOrder) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data,
    total: count,
    page,
    limit,
  });
}