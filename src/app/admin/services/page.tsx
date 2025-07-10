import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ServiceManagementClient from './ServiceManagementClient'

// This is the correct type definition for the data on this page.
export type ServiceProviderData = {
  id: number;
  created_at: string;
  user_id: string;
  business_name: string;
  service_areas: string;
  status: string;
  is_featured: boolean;
  contact_details: {
    email: string | null;
    phone: string | null;
  } | null;
}

export default async function AdminServicesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // This is the secure function that gets all applications for the admin.
  const { data: providers, error } = await supabase
    .rpc('get_all_service_applications');

  if (error) {
    console.error("Admin page error:", error)
    return <p className="p-6 text-red-500 font-semibold">Error: Could not fetch service providers. Reason: {error.message}</p>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Service Providers</h1>
      <ServiceManagementClient providers={providers as ServiceProviderData[] || []} />
    </div>
  )
}