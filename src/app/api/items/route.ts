'use server';

import { createClient } from '@/app/utils/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const searchParams = request.nextUrl.searchParams;
  
  const categorySlug = searchParams.get('category');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const conditions = searchParams.getAll('condition');
  const onSale = searchParams.get('on_sale') === 'true';
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const sortParam = searchParams.get('sort') || 'created_at.desc';
  const [sortColumn, sortOrder] = sortParam.split('.');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query;

    // We check for location params first. If they exist, we use the RPC call.
    if (lat && lon) {
        // IMPORTANT: The database function 'get_items_nearby' must also be updated
        // to return items with a 'pending_payment' status for this filter to work correctly.
        query = supabase
            .rpc('get_items_nearby', { 
                lat: parseFloat(lat), 
                long: parseFloat(lon), 
                radius_km: 50 // Default radius of 50km
            })
            .select('*, new_item_price, profiles:seller_id(username, avatar_url)');
            
        if (sortColumn && sortOrder) {
            query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
        }

    } else {
        // If no location, build a standard query where all filters can be applied.
        query = supabase
            .from('items')
            .select('*, new_item_price, profiles:seller_id(username, avatar_url)', { count: 'exact' })
            // --- FIX: This is the key change. We now fetch 'available' AND 'pending_payment' items. ---
            .in('status', ['available', 'pending_payment']);

        if (categorySlug) {
            const { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
            if (category) {
                query = query.eq('category_id', category.id);
            }
        }
        if (minPrice) query = query.gte('buy_now_price', parseFloat(minPrice));
        if (maxPrice) query = query.lte('buy_now_price', parseFloat(maxPrice));
        if (conditions.length > 0) query = query.in('condition', conditions);
        if (onSale) query = query.gt('discount_percentage', 0);
        
        if (sortColumn && sortOrder) {
            query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
        }
    }

    const { data, error, count } = await query.range(from, to);
    
    if (error) {
        console.error("API Error fetching items:", error);
        throw error;
    }

    return NextResponse.json({
      items: data,
      // Note: count is not reliable with RPC, so we estimate hasMore
      hasMore: data ? data.length === limit : false,
    });

  } catch (error: unknown) {
    const err = error as Error;
    return new NextResponse(
      JSON.stringify({ message: err.message || 'Failed to fetch items.' }),
      { status: 500 }
    );
  }
}
