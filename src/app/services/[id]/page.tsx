import { createClient } from '../../../utils/supabase/server'
import { notFound } from 'next/navigation'
import ImageGallery from '../../components/ImageGallery'
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react'
import AuthModalTrigger from './AuthModalTrigger' 
import BackButton from '../../components/BackButton' // Import the BackButton

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: provider } = await supabase
    .from('service_providers')
    .select(`
      *,
      service_categories ( name )
    `)
    .eq('id', params.id)
    .eq('status', 'approved')
    .single()

  if (!provider) {
    notFound()
  }

  const { business_name, description, service_areas, photos, contact_details, service_categories } = provider;

  const displayPhone = user 
    ? contact_details?.phone 
    : contact_details?.phone?.substring(0, 3) + ' *** ****';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div>
          <ImageGallery images={photos || []} itemTitle={business_name} />
        </div>

        <div>
          {service_categories?.name && (
            <span className="text-sm font-semibold text-brand">{service_categories.name}</span>
          )}
          <h1 className="text-4xl font-extrabold my-2">{business_name}</h1>
          
          <div className="flex items-center text-green-600 gap-2 mb-4">
             <ShieldCheck size={20} />
             <span className="font-semibold">Verified Provider</span>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
          
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Service Areas</h3>
            <div className="flex items-start text-gray-700 dark:text-gray-300">
              <MapPin className="mr-3 mt-1 flex-shrink-0" />
              <p>{service_areas}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 border-2 border-gray-200 rounded-lg bg-slate-800 text-white">
            <h3 className="font-semibold text-lg mb-3">Contact Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="mr-3" />
                <span>{displayPhone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-3" />
                <span>{user ? contact_details?.email : 'Log in to view email'}</span>
              </div>
            </div>

            {!user && (
              <AuthModalTrigger />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}