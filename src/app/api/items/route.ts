// src/app/api/items/route.ts
import { createClient } from '@/utils/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const queryParam = searchParams.get('q');
    const categorySlug = searchParams.get('category'); // e.g., 'electronics'
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sortBy = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    // The select statement is already correctly joining the categories table.
    let query = supabase
        .from('items')
        .select(`
            *,
            profiles:seller_id (*),
            categories ( name, slug )
        `)
        .eq('status', 'available');

    if (queryParam) {
        const cleanedQuery = queryParam.trim().split(' ').join(' & ');
        query = query.textSearch('fts', cleanedQuery, {
            type: 'websearch',
            config: 'english'
        });
    }

    // --- THIS IS THE FIX ---
    // This now filters the items by looking at the 'slug' column
    // in the joined 'categories' table.
    if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
    }
    // --- END OF FIX ---

    if (minPrice) {
        query = query.gte('buy_now_price', Number(minPrice));
    }
    if (maxPrice) {
        query = query.lte('buy_now_price', Number(maxPrice));
    }
    if (condition) {
        query = query.eq('condition', condition);
    }

    if (sortBy) {
        const [sortField, sortOrder] = sortBy.split('-');
        if (sortField && sortOrder) {
            query = query.order(sortField, { ascending: sortOrder === 'asc' });
        }
    } else {
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;

    if (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({ items: data });
}