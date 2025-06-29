import { createClient } from '@/app/utils/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { itemIds } = await request.json();

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data: items, error } = await supabase
      .from('items')
      .select('*, profiles:seller_id(*)')
      .in('id', itemIds)
      .eq('status', 'available');

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ items });

  } catch (error: unknown) {
    const err = error as Error;
    return new NextResponse(
      JSON.stringify({ message: err.message || 'Failed to fetch items.' }),
      { status: 500 }
    );
  }
}