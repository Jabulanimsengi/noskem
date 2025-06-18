import { createClient } from './utils/supabase/server';
import ItemCard, { type Item } from './components/ItemCard';

export const revalidate = 60;

export default async function HomePage() {
  // We now MUST await the createClient() function here as well
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from('items')
    .select('id, title, buy_now_price, images')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error.message);
  }

  return (
    <div className="container p-4 mx-auto sm:p-6">
      <h1 className="mb-6 text-3xl font-bold text-white">
        Latest Items
      </h1>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item as Item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-800 border-2 border-dashed rounded-lg border-gray-700">
            <h2 className="text-xl font-semibold text-white">No items available right now.</h2>
            <p className="mt-2 text-gray-400">Why not be the first to list something?</p>
        </div>
      )}
    </div>
  );
}