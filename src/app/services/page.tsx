import { createClient } from '../utils/supabase/server';
import ServiceProviderCard, { type ServiceProviderForCard } from '../components/ServiceProviderCard';
import Link from 'next/link';
import ServiceFilters from './ServiceFilters';
import BackButton from '../components/BackButton';

export interface ServiceSearchParams {
  q?: string;
  category?: string;
  lat?: string;
  lon?: string;
}

interface ServicesPageProps {
  searchParams: ServiceSearchParams;
}

export const revalidate = 60;

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const supabase = await createClient();
  let providers: any[] | null = null;
  let error: any = null;

  // --- THIS IS THE CORRECTED LOGIC ---
  // If location params are present, we use the RPC function directly.
  if (searchParams.lat && searchParams.lon) {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_service_providers_nearby', {
        lat: parseFloat(searchParams.lat),
        long: parseFloat(searchParams.lon),
        distance_km: 50
    });
    
    if (rpcData) {
        // Manually shape the data as the RPC function doesn't join with categories
        providers = rpcData.map((p: any) => ({ ...p, service_categories: null }));
    }
    error = rpcError;

  } else {
    // Otherwise, we build a standard query with filters.
    let query = supabase
      .from('service_providers')
      .select(`
        *,
        service_categories(name)
      `)
      .eq('status', 'approved');

    if (searchParams.q) {
      query = query.textSearch('fts', searchParams.q, { type: 'websearch', config: 'english' });
    }
    
    if (searchParams.category) {
      query = query.eq('category_id', searchParams.category);
    }

    const { data: queryData, error: queryError } = await query.order('is_featured', { ascending: false }).limit(24);
    providers = queryData;
    error = queryError;
  }

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name')
    .order('name');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-black">
          Explore Local Services
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Find trusted and verified service providers in your area.
        </p>
      </div>

      <ServiceFilters categories={categories || []} searchParams={searchParams} />
      
      {error && <p className="text-red-500 text-center">Error: {error.message}</p>}

      {!providers || providers.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Services Found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
          <Link href="/services" className="mt-4 inline-block bg-brand text-white px-5 py-2 rounded-md hover:bg-brand-dark">
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {(providers as ServiceProviderForCard[]).map(provider => (
            <ServiceProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
}